const { getFollowStatus } = require("../../database/follow/checkStatus");

exports.getFollowStatusController = async (req, res) => {
    try {
        const { targetUsername } = req.query;

        /* ================= VALIDATION ================= */

        if (!targetUsername) {
            return res.status(400).json({
                message: "targetUsername is required",
            });
        }

        /* ================= FOLLOW STATUS ================= */

        const response = await getFollowStatus(req.user, targetUsername);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to get follow status.",
            });
        }

        return res.status(200).json({
            message: "Follow status fetched successfully.",
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Get follow status controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
