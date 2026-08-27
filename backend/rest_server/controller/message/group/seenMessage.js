const { markGroupMessageAsSeen } = require("../../../database/message/group/seenMessage");

exports.seenGroupMessageController = async (req, res) => {
  try {
    const user = req.user;
    const { groupId } = req.body;

    /* ================= VALIDATION ================= */

    if (!groupId) {
      return res.status(400).json({
        message: "groupId is required",
      });
    }

    /* ================= DATABASE ================= */

    const response = await markGroupMessageAsSeen(user, groupId);

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Seen group message failed.",
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
      message: "Seen group message successfully.",
    });

  } catch (error) {
    console.error("Seen group message controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
