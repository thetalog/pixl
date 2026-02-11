const { findPostById } = require("../../database/post/getPost");

/* ================= GET SINGLE PUBLIC POST ================= */

exports.getSinglePublicPostController = async (req, res) => {
    try {
        const { postId } = req.query;

        /* ---------- Validation ---------- */

        if (!postId || typeof postId !== "string" || !postId.trim()) {
            return res.status(400).json({
                message: "postId is required",
            });
        }

        /* ---------- Database ---------- */

        const response = await findPostById(postId);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to fetch post.",
            });
        }

        if (!response || !response.data) {
            return res.status(404).json({
                message: "Post not found.",
            });
        }

        return res.status(200).json({
            data: response.data,
        });

    } catch (error) {
        console.error("Get single public post controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
