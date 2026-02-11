const { rejectFollowRequest } = require("../../database/follow/rejectRequest");

exports.rejectFollowController = async (req, res) => {
  try {
    const { requestId, requesterUsername } = req.body;

    /* ================= VALIDATION ================= */

    if (!requestId || !requesterUsername) {
      return res.status(400).json({
        message: "requestId and requesterUsername are required.",
      });
    }

    /* ================= DATABASE ================= */

    const response = await rejectFollowRequest(
      req.user,
      requestId,
      requesterUsername
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Follow reject failed.",
      });
    }

    /* ================= RESPONSE ================= */

    return res.status(200).json({
      message: "Follow rejected successfully.",
    });

  } catch (error) {
    console.error("Reject follow controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
