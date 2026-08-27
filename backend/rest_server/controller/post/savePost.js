const { toggleSavePost } = require("../../database/post/savePost");

/* ================= SAVE / UNSAVE POST ================= */

exports.saveOrUnsavePostController = async (req, res) => {
    try {
        const user = req.user;
        const { postId } = req.params;

        /* ---------- Validation ---------- */

        if (!postId) {
            return res.status(400).json({
                message: "postId is required",
            });
        }

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        /* ---------- Database ---------- */

        const response = await toggleSavePost(user, postId);

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message || "Post not found.",
            });
        }

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to save/unsave post.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            message: response?.message || "Post updated successfully.",
        });
    } catch (error) {
        console.error("Save/unsave post controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
