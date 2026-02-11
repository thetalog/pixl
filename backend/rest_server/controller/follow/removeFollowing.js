const {
    dbCheckIfTargetExist,
} = require("../../database/query/follow/dbCheckIfTargetExist");

const {
    dbRemoveFollowing,
} = require("../../database/query/follow/dbRemoveFollowing");

exports.removeFollowingController = async (req, res) => {
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

        /* ================= REMOVE FOLLOWING ================= */

        const response = await dbRemoveFollowing(req.user, targetUsername);

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
