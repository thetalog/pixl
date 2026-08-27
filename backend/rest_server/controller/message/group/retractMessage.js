const { retractGroupMessage } = require("../../../database/message/group/retractMessage");

exports.retractGroupMessageController = async (req, res) => {
  try {
    const user = req.user;
    const { groupId, messageId } = req.body;

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

    /* ================= DATABASE ================= */

    const response = await retractGroupMessage(
      user,
      groupId,
      messageId
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Retract group message failed.",
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
      message: "Retract group message successfully.",
    });

  } catch (error) {
    console.error("Retract group message controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
