import { dbSystemTags } from "../../database/query/posts/dbSystemTags.js";

/* ================= SYSTEM TAGS ================= */

export const updatePostSystemTagsController = async (req, res) => {
    try {
        const user = req.user;
        const { postId } = req.params;
        let { systemTags } = req.body;

        /* ---------- Validation ---------- */

        if (!postId) {
            return res.status(400).json({
                message: "postId is required",
            });
        }

        if (!Array.isArray(systemTags) || !systemTags.length) {
            return res.status(400).json({
                message: "systemTags must be a non-empty array",
            });
        }

        /* ---------- Normalize ---------- */

        systemTags = systemTags.map(tag => tag.toLowerCase());

        /* ---------- Database ---------- */

        const response = await dbSystemTags(
            user,
            postId,
            systemTags
        );

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message,
            });
        }

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to update system tags.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            message: response.message || "System tags updated successfully.",
        });

    } catch (error) {
        console.error("System tags controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
