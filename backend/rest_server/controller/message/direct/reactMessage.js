const {
  dbReactDirectMessage,
} = require("../../../database/query/message/direct/reactMessage");

exports.reactDirectMessageController = async (req, res) => {
  try {
    const user = req.user;
    const { senderUsername, messageId, emoji } = req.body;

    /* ================= VALIDATION ================= */

    if (!senderUsername) {
      return res.status(400).json({
        message: "senderUsername is required",
      });
    }

    if (!messageId) {
      return res.status(400).json({
        message: "messageId is required",
      });
    }

    if (!emoji) {
      return res.status(400).json({
        message: "emoji is required",
      });
    }

    /* ================= DATABASE ================= */

    const response = await dbReactDirectMessage(
      user,
      messageId,
      senderUsername,
      emoji
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "React direct message failed.",
      });
    }

    if (response?.status === 404) {
      return res.status(404).json({
        message: response.message,
      });
    }

    if (response?.status === 400) {
      return res.status(400).json({
        message: response.message,
      });
    }

    /* ================= SUCCESS ================= */

    return res.status(200).json({
      message: "React direct message successfully.",
    });

  } catch (error) {
    console.error("React direct message controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
