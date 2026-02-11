const { findPostsByCategory } = require("../../database/post/getPostsByCategory");
const { UICategory } = require("@prisma/client");

/* ================= GET POSTS BY UI CATEGORY ================= */

const getPostsByUICategoryController = async (req, res) => {
    try {
        const { category } = req.query;

        /* ---------- Validation ---------- */

        if (!category) {
            return res.status(400).json({
                message: "category is required",
            });
        }

        const categoryUpperCase = category.toUpperCase();

        if (!(categoryUpperCase in UICategory)) {
            return res.status(400).json({
                message: "Invalid UI category",
            });
        }

        /* ---------- Database ---------- */

        const response = await findPostsByCategory(categoryUpperCase);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to fetch posts by UI category.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Get posts by UI category controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};

module.exports = {
    getPostsByUICategoryController,
};
