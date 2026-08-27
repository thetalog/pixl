const { updatePostRecord } = require("../../database/post/updatePost.js");

/* ================= UPDATE POST ================= */

const updatePostController = async (req, res) => {
    try {
        const user = req.user;
        const { postId } = req.params;
        const data = req.body || {};

        /* ---------- Validation ---------- */

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        if (!postId) {
            return res.status(400).json({
                message: "postId is required",
            });
        }

        /* ---------- Database ---------- */

        const updatedPost = await updatePostRecord({
            postId,
            userId: user.id,
            data,
        });

        if (!updatedPost) {
            return res.status(403).json({
                message: "You are not allowed to edit this post",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            success: true,
            data: updatedPost,
        });

    } catch (error) {
        console.error("Update post controller error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};

module.exports = {
    updatePostController,
};
