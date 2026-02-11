const { approveFollowRequest } = require("../../database/follow/approveRequest");

exports.approveFollowController = async (req, res) => {
  try {
    const { requestId, requesterUsername } = req.body;

    /* ================= VALIDATION ================= */

    if (!requestId || !requesterUsername) {
      return res.status(400).json({
        message: "requestId and requesterUsername are required.",
      });
    }

    /* ================= DATABASE ================= */

    const response = await approveFollowRequest(
      req.user,
      requestId,
      requesterUsername
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Follow approval failed.",
      });
    }

    /* ================= RESPONSE ================= */

    return res.status(200).json({
      message: "Follow approved successfully.",
    });

  } catch (error) {
    console.error("Approve follow controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
