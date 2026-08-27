const { sendFollowRequest } = require("../../database/follow/sendRequest");

exports.requestFollowController = async (req, res) => {
  try {
    const { targetUsername } = req.body;

    if (!targetUsername) {
      return res.status(400).json({
        message: "targetUsername is required",
      });
    }

    const response = await sendFollowRequest(req.user, targetUsername);

    if (response?.error) {
      return res.status(response.status || 400).json({
        message: response.message,
      });
    }

    return res.status(response.status || 200).json({
      message: response.message,
    });

  } catch (error) {
    console.error("requestFollowController error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};