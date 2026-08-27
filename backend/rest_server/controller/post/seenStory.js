const { markStoriesAsSeen } = require("../../database/post/seenStory");

/* ================= SEEN STORY ================= */

const seenStoryController = async (req, res) => {
    try {
        const user = req.user;
        const { storyId } = req.query;

        /* ---------- Validation ---------- */

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        if (!storyId) {
            return res.status(400).json({
                message: "storyId is required",
            });
        }

        /* ---------- Database ---------- */

        const response = await markStoriesAsSeen(
            user.id,
            storyId
        );

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message || "Story not found.",
            });
        }

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to mark story as seen.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            message: "Story marked as seen.",
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Seen story controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};

module.exports = {
    seenStoryController,
};
