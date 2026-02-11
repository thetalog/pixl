const { cancelFollowRequest } = require("../../database/follow/removeRequest");

exports.removeFollowRequestController = async (req, res) => {
    try {
        const { targetUsername } = req.query;

        /* ================= VALIDATION ================= */

        if (!targetUsername) {
            return res.status(400).json({
                message: "targetUsername is required",
            });
        }

        /* ================= REMOVE REQUEST ================= */

        const response = await cancelFollowRequest(req.user, targetUsername);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to remove follow request.",
            });
        }

        return res.status(200).json({
            message: "Follow request removed successfully.",
        });

    } catch (error) {
        console.error("Remove follow request controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
