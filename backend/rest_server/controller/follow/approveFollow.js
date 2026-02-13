const { approveFollowRequest } = require("../../database/follow/approveRequest");

exports.approveFollowController = async (req, res) => {
  try {
    const { requestId, requesterUsername } = req.body;

    if (!requestId || !requesterUsername) {
      return res.status(400).json({
        message: "requestId and requesterUsername are required.",
      });
    }

    const response = await approveFollowRequest(
      req.user,
      requestId,
      requesterUsername
    );

    if (response?.error) {
      return res.status(response.status || 400).json({
        message: response.message,
      });
    }

    return res.status(200).json({
      message: response.message,
    });

  } catch (error) {
    console.error("Approve follow controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};