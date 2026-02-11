const {
    dbCheckIfTargetExist,
} = require("../../database/query/follow/dbCheckIfTargetExist");

const {
    dbGetFollowStatus,
} = require("../../database/query/follow/dbGetFollowStatus");

exports.getFollowStatusController = async (req, res) => {
    try {
        const { targetUsername } = req.query;

        /* ================= VALIDATION ================= */

        if (!targetUsername) {
            return res.status(400).json({
                message: "targetUsername is required",
            });
        }

        /* ================= CHECK TARGET ================= */

        const targetExists = await dbCheckIfTargetExist(targetUsername);

        if (targetExists?.error) {
            return res.status(404).json({
                message: "Target user not found.",
            });
        }

        /* ================= FOLLOW STATUS ================= */

        const response = await dbGetFollowStatus(req.user, targetUsername);

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
