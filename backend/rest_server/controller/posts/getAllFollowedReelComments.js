import { dbGetAllFollowedReelComments } from "../../database/query/posts/dbGetAllFollowedReelComments.js";

/* ================= GET REEL COMMENTS ================= */

export const getReelCommentsController = async (req, res) => {
    try {
        const user = req.user;
        let { reelId, skip, take } = req.query;

        /* ---------- Validation ---------- */

        if (!reelId) {
            return res.status(400).json({
                message: "reelId is required",
            });
        }

        if (skip === undefined || take === undefined) {
            return res.status(400).json({
                message: "skip and take are required",
            });
        }

        skip = Number(skip);
        take = Number(take);

        if (!Number.isInteger(skip) || !Number.isInteger(take)) {
            return res.status(400).json({
                message: "skip and take must be integers",
            });
        }

        /* ---------- Database ---------- */

        const response = await dbGetAllFollowedReelComments(
            user,
            reelId,
            skip,
            take
        );

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message || "Reel not found.",
            });
        }

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to fetch reel comments.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Get reel comments controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
