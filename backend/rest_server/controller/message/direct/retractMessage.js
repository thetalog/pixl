const { retractDirectMessage } = require("../../../database/message/direct/retractMessage");

exports.retractDirectMessageController = async (req, res) => {
  try {
    const user = req.user;
    const { receiverUsername, messageId } = req.body;

    /* ================= VALIDATION ================= */

    if (!receiverUsername) {
      return res.status(400).json({
        message: "receiverUsername is required",
      });
    }

    if (!messageId) {
      return res.status(400).json({
        message: "messageId is required",
      });
    }

    /* ================= DATABASE ================= */

    const response = await retractDirectMessage(user, receiverUsername, messageId);

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
