const {
  dbRetractMessage,
} = require("../../../database/query/message/direct/retractMessage");

exports.retractDirectMessageController = async (req, res) => {
  try {
    const user = req.user;
    const { senderUsername, messageId } = req.body;

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

    /* ================= DATABASE ================= */

    const response = await dbRetractMessage(
      user,
      messageId,
      senderUsername
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Retract direct message failed.",
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
      message: "Retract direct message successfully.",
    });

  } catch (error) {
    console.error("Retract direct message controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
