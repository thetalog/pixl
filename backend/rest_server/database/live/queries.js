const prisma = require("../../lib/prisma");

const publicUser = {
  id: true,
  userName: true,
  name: true,
  profilePic: true,
};

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;

function isObjectId(id) {
  return typeof id === "string" && OBJECT_ID.test(id);
}

function isWriteConflict(err) {
  return err?.code === "P2034" || /write conflict or a deadlock/i.test(String(err?.message || ""));
}

async function withWriteRetry(fn, attempts = 6) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isWriteConflict(err) || attempt === attempts - 1) {
        throw err;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 40 * 2 ** attempt + Math.floor(Math.random() * 50))
      );
    }
  }
  throw last;
}

const streamUserInclude = { user: { select: publicUser } };
const streamDetailInclude = {
  user: { select: publicUser },
  comments: {
    include: { user: { select: publicUser } },
    orderBy: { createdAt: "asc" },
  },
};

async function findLiveStreamRecord(liveId, include) {
  if (!liveId || typeof liveId !== "string") return null;
  const query = include ? { include } : {};
  if (isObjectId(liveId)) {
    return prisma.liveStream.findUnique({ where: { id: liveId }, ...query });
  }
  return prisma.liveStream.findFirst({ where: { javaStreamId: liveId }, ...query });
}

async function createLiveStream(userId, title, url, extra = {}) {
  return prisma.liveStream.create({
    data: {
      userId,
      title,
      url,
      viewers: [],
      status: extra.status || "CREATED",
      visibility: extra.visibility || "PUBLIC",
      recordingEnabled: Boolean(extra.recordingEnabled),
      javaStreamId: extra.javaStreamId || null,
    },
    include: { user: { select: publicUser } },
  });
}

async function updateLiveStream(liveId, data) {
  return withWriteRetry(async () => {
    const stream = await findLiveStreamRecord(liveId);
    if (!stream) return null;
    return prisma.liveStream.update({
      where: { id: stream.id },
      data,
      include: streamUserInclude,
    });
  });
}

async function endLiveStream(liveId) {
  return withWriteRetry(async () => {
    const stream = await findLiveStreamRecord(liveId);
    if (!stream) return null;
    return prisma.liveStream.update({
      where: { id: stream.id },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
      include: streamUserInclude,
    });
  });
}

async function getLiveStream(liveId) {
  return findLiveStreamRecord(liveId, streamDetailInclude);
}

function activeLiveWhere() {
  return {
    status: { in: ["LIVE", "STARTING", "CREATED"] },
    javaStreamId: { not: null },
    createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  };
}

async function listLiveStreams() {
  return prisma.liveStream.findMany({
    where: activeLiveWhere(),
    include: { user: { select: publicUser } },
    orderBy: { startedAt: "desc" },
  });
}

async function getActiveLiveByUsername(username) {
  const profile = await prisma.user.findUnique({
    where: { userName: username },
    select: { id: true },
  });
  if (!profile) return null;
  return prisma.liveStream.findFirst({
    where: {
      userId: profile.id,
      ...activeLiveWhere(),
    },
    include: { user: { select: publicUser } },
    orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
  });
}

async function addViewer(liveId, userId) {
  return withWriteRetry(async () => {
    const stream = await findLiveStreamRecord(liveId);
    if (!stream) return null;
    if (Array.isArray(stream.viewers) && stream.viewers.includes(userId)) {
      return stream;
    }
    return prisma.liveStream.update({
      where: { id: stream.id },
      data: {
        viewers: {
          push: userId,
        },
      },
    });
  });
}

async function removeViewer(liveId, userId) {
  return withWriteRetry(async () => {
    const stream = await findLiveStreamRecord(liveId);
    if (!stream) return null;
    const next = (stream.viewers || []).filter((viewer) => viewer !== userId);
    if (next.length === (stream.viewers || []).length) {
      return stream;
    }
    return prisma.liveStream.update({
      where: { id: stream.id },
      data: { viewers: next },
    });
  });
}

async function addLiveComment(liveId, userId, text) {
  const chat = await prisma.liveStreamComments.create({
    data: {
      liveId,
      userId,
      text,
    },
    include: {
      user: {
        select: {
          userName: true,
          profilePic: true,
        },
      },
    },
  });

  if (global.io) {
    global.io.to(liveId).emit("newChat", chat);
  }

  return chat;
}

async function getLiveComments(liveId) {
  return prisma.liveStreamComments.findMany({
    where: { liveId },
    include: { user: { select: publicUser } },
    orderBy: { createdAt: "asc" },
  });
}

async function isFollowing(userId, targetId) {
  const row = await prisma.follow.findFirst({
    where: { userId, targetId },
  });
  return Boolean(row);
}

async function followerIds(hostUserId) {
  const rows = await prisma.follow.findMany({
    where: { targetId: hostUserId },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
}

module.exports = {
  isObjectId,
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
};
