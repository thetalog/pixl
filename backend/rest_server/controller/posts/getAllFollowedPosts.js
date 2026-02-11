import { dbGetAllFollowedPosts } from "../../database/query/posts/dbGetAllFollowedPosts.js";

/* ================= FOLLOWED FEED ================= */

export const getFollowedPostsController = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const response = await dbGetAllFollowedPosts(user);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to fetch followed posts.",
            });
        }

        return res.status(200).json({
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Get followed posts controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
