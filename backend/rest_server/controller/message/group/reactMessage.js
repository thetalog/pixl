const {
  dbReactGroupMessage,
} = require("../../../database/query/message/group/reactMessage");

exports.reactGroupMessageController = async (req, res) => {
  try {
    const user = req.user;
    const { groupId, messageId, emoji } = req.body;

    /* ================= VALIDATION ================= */

    if (!groupId) {
      return res.status(400).json({
        message: "groupId is required",
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

    const response = await dbReactGroupMessage(
      user,
      groupId,
      messageId,
      emoji
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "React group message failed.",
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
      message: "React group message successfully.",
    });

  } catch (error) {
    console.error("React group message controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
