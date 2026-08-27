const { toggleReelLike } = require("../../database/post/likeReel");

/* ================= LIKE / UNLIKE REEL ================= */

exports.likeOrUnlikeReelController = async (req, res) => {
    try {
        const user = req.user;
        const { reelId } = req.params;

        /* ---------- Validation ---------- */

        if (!reelId) {
            return res.status(400).json({
                message: "reelId is required",
            });
        }

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        /* ---------- Database ---------- */

        const response = await toggleReelLike(user, reelId);

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message || "Reel not found.",
            });
        }

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to like/unlike reel.",
            });
        }

        /* ---------- Success ---------- */

        return res.status(200).json({
            message: response?.message || "Reel updated successfully.",
            data: response?.data,
        });

    } catch (error) {
        console.error("Like/unlike reel controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
