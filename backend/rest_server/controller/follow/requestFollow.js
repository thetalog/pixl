const { sendFollowRequest } = require("../../database/follow/sendRequest");
const { getTargetPrivacyStatus } = require("../../database/follow/getTargetStatus");

exports.requestFollowController = async (req, res) => {
  try {
    const { targetUsername } = req.body;

    /* ================= VALIDATION ================= */

    if (!targetUsername) {
      return res.status(400).json({
        message: "targetUsername is required",
      });
    }

    /* ================= CHECK PRIVACY ================= */

    const targetPrivacyStatus = await getTargetPrivacyStatus(targetUsername);

    if (targetPrivacyStatus?.error) {
      return res.status(404).json({
        message: "Target user not found.",
      });
    }

    /* ================= PRIVATE ACCOUNT ================= */

    if (targetPrivacyStatus.isPrivate) {
      const response = await sendFollowRequest(req.user, targetUsername);

      if (response?.error) {
        return res.status(400).json(response);
      }

      return res.status(200).json({
        message: "Follow request sent successfully.",
      });
    }

    /* ================= PUBLIC ACCOUNT ================= */

    const response = await sendFollowRequest(req.user, targetUsername);

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Follow failed.",
      });
    }

    return res.status(200).json({
      message: "Followed successfully.",
    });

  } catch (error) {
    console.error("Request follow controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
