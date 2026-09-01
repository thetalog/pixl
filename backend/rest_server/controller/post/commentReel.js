const { addReelComment } = require("../../database/post/reelComment");
const { assertCanComment } = require("../../lib/admin/restrictions");

/* ================= REEL COMMENT ================= */

exports.reelCommentController = async (req, res) => {
    try {
        const user = req.user;
        const { reelId } = req.params;
        const { commentText } = req.body;

        /* ---------- Validation ---------- */

        if (!reelId) {
            return res.status(400).json({
                message: "reelId is required",
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

        /* ---------- Database ---------- */

        const response = await addReelComment(
            user,
            reelId,
            commentText.trim()
        );

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to post reel comment.",
            });
        }

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message || "Reel not found.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            message: "Reel comment posted successfully.",
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Reel comment controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
