const { addPostComment } = require("../../database/post/commentPost");
const { assertCanComment } = require("../../lib/admin/restrictions");
const prisma = require("../../lib/prisma");

/* ================= POST COMMENT ================= */

exports.postCommentController = async (req, res) => {
    try {
        const user = req.user;
        const { postId } = req.params;
        const { commentText } = req.body;

        /* ---------- Validation ---------- */

        if (!postId) {
            return res.status(400).json({
                message: "postId is required",
            });
        }

        if (!commentText || typeof commentText !== "string" || !commentText.trim()) {
            return res.status(400).json({
                message: "commentText is required",
            });
        }

        try {
            await assertCanComment(user);
        } catch (flagError) {
            return res.status(flagError.status || 403).json({
                error: true,
                message: flagError.message,
                code: flagError.code,
            });
        }

        const post = await prisma.post.findUnique({ where: { id: postId }, select: { commentsLocked: true } }).catch(() => null);
        if (post?.commentsLocked) {
            return res.status(403).json({
                error: true,
                message: "Comments are locked on this post.",
                code: "DISCUSSION_LOCKED",
            });
        }

        /* ---------- Database ---------- */

        const response = await addPostComment(
            user,
            postId,
            commentText.trim()
        );

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to post comment.",
            });
        }

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message || "Post not found.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            message: "Comment posted successfully.",
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Post comment controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
