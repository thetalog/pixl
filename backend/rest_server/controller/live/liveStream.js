const crypto = require("crypto");
const path = require("path");
const { spawn } = require("child_process");

const {
    createLiveStream,
    endLiveStream,
    getLiveStream,
    addViewer,
    removeViewer,
    addLiveComment,
    getLiveComments,
} = require("../../database/live/queries");

let liveSocketProcess = null;

/* ================= START LIVE ================= */

exports.startLiveController = async (req, res) => {
    try {
        const { title } = req.body;
        const userId = req.user.id;

        if (!title) {
            return res.status(400).json({
                message: "Title is required",
            });
        }

        const liveId = crypto.randomUUID();
        const wsUrl = `ws://192.168.31.8:9090/live/${liveId}`;

        const stream = await createLiveStream(userId, title, wsUrl);

        return res.status(200).json(stream);
    } catch (error) {
        console.error("Start live error:", error);
        return res.status(500).json({ message: error.message });
    }
};

/* ================= END LIVE ================= */

exports.endLiveController = async (req, res) => {
    try {
        await endLiveStream(req.params.liveId);

        return res.json({ success: true });
    } catch (error) {
        console.error("End live error:", error);
        return res.status(500).json({ message: error.message });
    }
};

/* ================= GET LIVE ================= */

exports.getLiveController = async (req, res) => {
    try {
        const stream = await getLiveStream(req.params.liveId);
        return res.json(stream);
    } catch (error) {
        console.error("Get live error:", error);
        return res.status(500).json({ message: error.message });
    }
};

/* ================= JOIN ================= */

exports.joinLiveController = async (req, res) => {
    try {
        await addViewer(req.params.liveId, req.user.id);
        return res.json({ joined: true });
    } catch (error) {
        console.error("Join live error:", error);
        return res.status(500).json({ message: error.message });
    }
};

/* ================= LEAVE ================= */

exports.leaveLiveController = async (req, res) => {
    try {
        await removeViewer(req.params.liveId, req.user.id);
        return res.json({ left: true });
    } catch (error) {
        console.error("Leave live error:", error);
        return res.status(500).json({ message: error.message });
    }
};

/* ================= COMMENT ================= */

exports.addLiveCommentController = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Text is required" });
        }

        const msg = await addLiveComment(req.params.liveId, req.user.id, text);

        return res.json(msg);
    } catch (error) {
        console.error("Add comment error:", error);
        return res.status(500).json({ message: error.message });
    }
};

/* ================= GET COMMENTS ================= */

exports.getLiveCommentsController = async (req, res) => {
    try {
        const msgs = await getLiveComments(req.params.liveId);
        return res.json(msgs);
    } catch (error) {
        console.error("Get comments error:", error);
        return res.status(500).json({ message: error.message });
    }
};

/* ================= START COMMENT SOCKET ================= */

exports.startLiveCommentSocketController = async (req, res) => {
    try {
        const { liveId } = req.params;

        if (liveSocketProcess) {
            return res.json({
                success: true,
                message: "Live comment socket already running",
                pid: liveSocketProcess.pid,
                liveId,
            });
        }

        const socketPath = path.join(__dirname, "../sockets/liveCommentSocket.js");

        liveSocketProcess = spawn("node", [socketPath, liveId], {
            detached: true,
            stdio: "ignore",
        });

        liveSocketProcess.unref();

        return res.json({
            success: true,
            message: "Live comment socket started",
            pid: liveSocketProcess.pid,
            liveId,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};
