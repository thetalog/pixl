const { unfollowUser } = require("../../database/follow/removeFollowing");

exports.removeFollowingController = async (req, res) => {
    try {
        const { targetUsername } = req.query;

        /* ================= VALIDATION ================= */

        if (!targetUsername) {
            return res.status(400).json({
                message: "targetUsername is required",
            });
        }

        /* ================= REMOVE FOLLOWING ================= */

        const response = await unfollowUser(req.user, targetUsername);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to remove following.",
            });
        }

        return res.status(200).json({
            message: "Unfollowed successfully.",
        });

    } catch (error) {
        console.error("Remove following controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
