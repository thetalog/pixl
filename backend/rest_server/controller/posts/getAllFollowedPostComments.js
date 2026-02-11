import { dbGetAllFollowedPostComments } from "../../database/query/posts/dbGetAllFollowedPostComments.js";

/* ================= GET POST COMMENTS ================= */

export const getPostCommentsController = async (req, res) => {
    try {
        const user = req.user;
        let { postId, skip, take } = req.query;

        /* ---------- Validation ---------- */

        if (!postId) {
            return res.status(400).json({
                message: "postId is required",
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

        const response = await dbGetAllFollowedPostComments(
            user,
            postId,
            skip,
            take
        );

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message || "Post not found.",
            });
        }

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to fetch comments.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Get post comments controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
