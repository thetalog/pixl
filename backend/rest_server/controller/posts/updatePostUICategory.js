import { dbUICategory } from "../../database/query/posts/dbUICategory.js";
import { UICategory } from "@prisma/client";

/* ================= UPDATE UI CATEGORY ================= */

export const updatePostUICategoryController = async (req, res) => {
    try {
        const { postId, category } = req.params;

        /* ---------- Validation ---------- */

        if (!postId || !category) {
            return res.status(400).json({
                message: "postId and category are required.",
            });
        }

        const categoryUpperCase = category.toUpperCase();

        if (!(categoryUpperCase in UICategory)) {
            return res.status(400).json({
                message: "Invalid UI category.",
            });
        }

        /* ---------- Database ---------- */

        const response = await dbUICategory(postId, categoryUpperCase);

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message,
            });
        }

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to update UI category.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            message: response.message || "UI category updated successfully.",
        });

    } catch (error) {
        console.error("Update UI category controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
