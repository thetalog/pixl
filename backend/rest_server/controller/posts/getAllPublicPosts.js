import { dbGetAllPublicPosts } from "../../database/query/posts/getAllPublicPosts.js";

/* ================= GET ALL PUBLIC POSTS ================= */

export const getAllPublicPostsController = async (req, res) => {
    try {
        const response = await dbGetAllPublicPosts();

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to fetch public posts.",
            });
        }

        return res.status(200).json({
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Get all public posts controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
