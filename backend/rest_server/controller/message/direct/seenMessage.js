const { markDirectMessageAsSeen } = require("../../../database/message/direct/seenMessage");

exports.seenDirectMessageController = async (req, res) => {
  try {
    const user = req.user;
    const { senderUsername } = req.body;

    /* ================= VALIDATION ================= */

    if (!senderUsername) {
      return res.status(400).json({
        message: "senderUsername is required",
      });
    }

    /* ================= DATABASE ================= */

    const response = await markDirectMessageAsSeen(user, senderUsername);

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Seen direct message failed.",
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
      message: "Seen direct message successfully.",
    });

  } catch (error) {
    console.error("Seen direct message controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
