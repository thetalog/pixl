const {
  dbFollowRequest,
} = require("../../database/query/follow/request");

const {
  dbCheckAccountPrivacyStatus,
} = require("../../database/query/follow/checkAccountPrivacyStatus");

const {
  dbFollowPublicAccount,
} = require("../../database/query/follow/publicAccountFollow");

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

    const targetHasPrivateAccount =
      await dbCheckAccountPrivacyStatus(targetUsername);

    if (targetHasPrivateAccount?.error) {
      return res.status(404).json({
        message: "Target user not found.",
      });
    }

    /* ================= PRIVATE ACCOUNT ================= */

    if (targetHasPrivateAccount) {
      const response = await dbFollowRequest(req.user, targetUsername);

      if (response?.error) {
        return res.status(400).json(response);
      }

      return res.status(200).json({
        message: "Follow request sent successfully.",
      });
    }

    /* ================= PUBLIC ACCOUNT ================= */

    const response = await dbFollowPublicAccount(req.user, targetUsername);

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
