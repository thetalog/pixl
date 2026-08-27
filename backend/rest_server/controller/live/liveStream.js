const {
  createLiveStream,
  updateLiveStream,
  endLiveStream,
  getLiveStream,
  listLiveStreams,
  getActiveLiveByUsername,
  addViewer,
  removeViewer,
  addLiveComment,
  getLiveComments,
  isFollowing,
  followerIds,
} = require("../../database/live/queries");
const live = require("../../lib/live/livestreamClient");
const { signLiveToken, permissionsFor } = require("../../lib/live/liveToken");
const { notifyUser } = require("../../lib/notifyUser");

function clientError(error, fallback = "Something went wrong") {
  const msg = String(error?.message || "");
  if (msg.includes("Unknown argument") || msg.includes("Invalid `prisma.liveStream")) {
    return "Livestream schema is out of date. Run npx prisma generate && npx prisma db push in rest_server, then restart the API.";
  }
  if (!msg || msg.length > 180 || msg.includes("\n")) {
    return fallback;
  }
  return msg;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    userName: user.userName,
    name: user.name,
    profilePic: user.profilePic,
  };
}

function shapeStream(stream, session) {
  if (!stream) return null;
  return {
    id: stream.id,
    javaStreamId: stream.javaStreamId,
    userId: stream.userId,
    user: publicUser(stream.user),
    title: stream.title,
    url: session?.signalingUrl || stream.url,
    status: stream.status,
    visibility: stream.visibility,
    recordingEnabled: stream.recordingEnabled,
    viewerCount: stream.viewerCount || (Array.isArray(stream.viewers) ? stream.viewers.length : 0),
    likeCount: stream.likeCount || 0,
    viewers: stream.viewers || [],
    comments: stream.comments,
    startedAt: stream.startedAt,
    endedAt: stream.endedAt,
    createdAt: stream.createdAt,
    session: session || null,
  };
}

async function canJoin(reqUser, stream) {
  if (!stream) return false;
  if (stream.userId === reqUser.id) return true;
  if (stream.visibility === "PUBLIC") return true;
  if (stream.visibility === "FOLLOWERS") {
    return isFollowing(reqUser.id, stream.userId);
  }
  return false;
}

exports.startLiveController = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const visibility = String(req.body?.visibility || "PUBLIC").toUpperCase();
    const recordingEnabled = Boolean(req.body?.recordingEnabled);
    const user = req.user;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const placeholderUrl = process.env.LIVE_SIGNALING_URL || "ws://localhost:8085/ws/live";
    const stream = await createLiveStream(user.id, title, placeholderUrl, {
      status: "CREATED",
      visibility: ["PUBLIC", "FOLLOWERS", "PRIVATE"].includes(visibility) ? visibility : "PUBLIC",
      recordingEnabled,
    });

    try {
      const created = await live.createStream({
        pixlStreamId: stream.id,
        hostUserId: user.id,
        hostUsername: user.userName,
        hostDisplayName: user.name,
        hostAvatarUrl: user.profilePic || "",
        title,
        visibility: stream.visibility,
        recordingEnabled,
      });
      const javaStream = created.stream;
      const session = created.session;
      const updated = await updateLiveStream(stream.id, {
        javaStreamId: javaStream.streamId,
        url: session.signalingUrl,
        status: javaStream.status || "CREATED",
      });

      const token = signLiveToken({
        user,
        streamId: javaStream.streamId,
        pixlStreamId: stream.id,
        role: "HOST",
        permissions: permissionsFor("HOST"),
      });
      session.token = token;

      return res.status(200).json(shapeStream(updated, session));
    } catch (error) {
      const wrapped = live.unwrapAxios(error);
      await updateLiveStream(stream.id, { status: "FAILED" }).catch(() => {});
      return res.status(wrapped.status || 503).json({ message: wrapped.message });
    }
  } catch (error) {
    console.error("Start live error:", error);
    return res.status(500).json({ message: clientError(error, "Could not go live") });
  }
};

exports.endLiveController = async (req, res) => {
  try {
    const stream = await getLiveStream(req.params.liveId);
    if (!stream) {
      return res.status(404).json({ message: "Live not found" });
    }
    if (stream.userId !== req.user.id) {
      return res.status(403).json({ message: "Only the host can end this live" });
    }
    if (stream.javaStreamId) {
      try {
        await live.endStream(stream.javaStreamId, req.user.id);
      } catch (error) {
        console.error("Java end live error:", live.unwrapAxios(error).message);
      }
    }
    const ended = await endLiveStream(req.params.liveId);
    if (!ended) {
      return res.status(404).json({ message: "Live not found" });
    }
    return res.json({ success: true, stream: shapeStream(ended) });
  } catch (error) {
    console.error("End live error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getLiveController = async (req, res) => {
  try {
    const stream = await getLiveStream(req.params.liveId);
    if (!stream) {
      return res.status(404).json({ message: "Live not found" });
    }
    if (!(await canJoin(req.user, stream))) {
      return res.status(403).json({ message: "You cannot view this live" });
    }
    let session = null;
    if (stream.javaStreamId && stream.status !== "ENDED" && stream.status !== "FAILED") {
      try {
        const role = stream.userId === req.user.id ? "HOST" : "VIEWER";
        session = await live.joinStream(stream.javaStreamId, {
          userId: req.user.id,
          userName: req.user.userName,
          displayName: req.user.name,
          avatarUrl: req.user.profilePic || "",
          role,
        });
        session.token = signLiveToken({
          user: req.user,
          streamId: stream.javaStreamId,
          pixlStreamId: stream.id,
          role,
          permissions: permissionsFor(role),
        });
      } catch (error) {
        console.error("Java join token error:", live.unwrapAxios(error).message);
      }
    }
    return res.json(shapeStream(stream, session));
  } catch (error) {
    console.error("Get live error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getLiveByUsernameController = async (req, res) => {
  try {
    const username = String(req.params.username || "").trim();
    if (!username) {
      return res.status(400).json({ message: "username is required" });
    }
    const stream = await getActiveLiveByUsername(username);
    if (!stream) {
      return res.json({ live: false, stream: null });
    }
    if (!(await canJoin(req.user, stream))) {
      return res.json({ live: false, stream: null });
    }
    return res.json({ live: true, stream: shapeStream(stream) });
  } catch (error) {
    console.error("Get live by username error:", error);
    return res.status(500).json({ message: "Could not load live status" });
  }
};

exports.listLiveController = async (req, res) => {
  try {
    const streams = await listLiveStreams();
    const visible = [];
    for (const stream of streams) {
      if (await canJoin(req.user, stream)) {
        visible.push(shapeStream(stream));
      }
    }
    return res.json({ data: visible });
  } catch (error) {
    console.error("List live error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.joinLiveController = async (req, res) => {
  try {
    const stream = await getLiveStream(req.params.liveId);
    if (!stream) {
      return res.status(404).json({ message: "Live not found" });
    }
    if (!(await canJoin(req.user, stream))) {
      return res.status(403).json({ message: "You cannot join this live" });
    }
    await addViewer(req.params.liveId, req.user.id);
    let session = null;
    if (stream.javaStreamId) {
      session = await live.joinStream(stream.javaStreamId, {
        userId: req.user.id,
        userName: req.user.userName,
        displayName: req.user.name,
        avatarUrl: req.user.profilePic || "",
        role: stream.userId === req.user.id ? "HOST" : "VIEWER",
      });
      const role = stream.userId === req.user.id ? "HOST" : "VIEWER";
      session.token = signLiveToken({
        user: req.user,
        streamId: stream.javaStreamId,
        pixlStreamId: stream.id,
        role,
        permissions: permissionsFor(role),
      });
    }
    return res.json({ joined: true, stream: shapeStream(stream, session), session });
  } catch (error) {
    const wrapped = live.unwrapAxios(error);
    console.error("Join live error:", wrapped.message);
    return res.status(wrapped.status || 500).json({ message: wrapped.message });
  }
};

exports.leaveLiveController = async (req, res) => {
  try {
    await removeViewer(req.params.liveId, req.user.id);
    return res.json({ left: true });
  } catch (error) {
    console.error("Leave live error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.addLiveCommentController = async (req, res) => {
  try {
    const text = String(req.body?.text || req.body?.message || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }
    const stream = await getLiveStream(req.params.liveId);
    if (!stream) {
      return res.status(404).json({ message: "Live not found" });
    }
    if (!(await canJoin(req.user, stream))) {
      return res.status(403).json({ message: "You cannot comment on this live" });
    }
    const msg = await addLiveComment(req.params.liveId, req.user.id, text);
    return res.json(msg);
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getLiveCommentsController = async (req, res) => {
  try {
    const msgs = await getLiveComments(req.params.liveId);
    return res.json(msgs);
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getLiveViewersController = async (req, res) => {
  try {
    const stream = await getLiveStream(req.params.liveId);
    if (!stream) {
      return res.status(404).json({ message: "Live not found" });
    }
    if (stream.javaStreamId) {
      try {
        const viewers = await live.getViewers(stream.javaStreamId);
        return res.json({ data: viewers, viewerCount: Array.isArray(viewers) ? viewers.length : stream.viewerCount });
      } catch (error) {
        console.error("Java viewers error:", live.unwrapAxios(error).message);
      }
    }
    return res.json({ data: [], viewerCount: stream.viewerCount || 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.internalStatusController = async (req, res) => {
  try {
    const stream = await getLiveStream(req.params.liveId);
    if (!stream) {
      return res.status(404).json({ message: "Live not found" });
    }
    const status = String(req.body?.status || stream.status).toUpperCase();
    const data = {
      status,
      viewerCount: Number(req.body?.viewerCount || stream.viewerCount || 0),
      likeCount: Number(req.body?.likeCount || stream.likeCount || 0),
    };
    if (status === "LIVE" && !stream.startedAt) {
      data.startedAt = new Date();
    }
    if (status === "ENDED" || status === "FAILED") {
      data.endedAt = new Date();
    }
    const updated = await updateLiveStream(stream.id, data);
    if (!updated) {
      return res.status(404).json({ message: "Live not found" });
    }
    if (status === "LIVE" && stream.status !== "LIVE") {
      const followers = await followerIds(stream.userId);
      const hostName = stream.user?.userName || "Someone";
      await Promise.all(
        followers.map((id) =>
          notifyUser(id, {
            message: `@${hostName} is live: ${stream.title}`,
            type: "live",
          })
        )
      );
    }
    return res.json({ ok: true, stream: shapeStream(updated) });
  } catch (error) {
    console.error("Internal live status error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.internalCommentController = async (req, res) => {
  try {
    const stream = await getLiveStream(req.params.liveId);
    if (!stream) {
      return res.status(404).json({ message: "Live not found" });
    }
    const text = String(req.body?.text || req.body?.message || "").trim();
    const userId = req.body?.userId;
    if (!text || !userId) {
      return res.status(400).json({ message: "userId and text are required" });
    }
    const msg = await addLiveComment(stream.id, userId, text);
    return res.json(msg);
  } catch (error) {
    console.error("Internal live comment error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.startLiveCommentSocketController = async (req, res) => {
  return res.status(410).json({
    message: "Live comments now use the Java livestream WebSocket. See LIVE_SIGNALING_URL.",
  });
};
