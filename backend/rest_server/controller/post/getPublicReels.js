const { findPublicReels } = require("../../database/post/getPublicReels");

/* ================= GET ALL PUBLIC REELS ================= */

exports.getAllPublicReelsController = async (req, res) => {
    try {
        let { skip, take } = req.query;

        /* ---------- Validation ---------- */

        if (skip === undefined || take === undefined) {
            return res.status(400).json({
                message: "skip and take are required.",
            });
        }

        skip = Number(skip);
        take = Number(take);

        if (!Number.isInteger(skip) || !Number.isInteger(take)) {
            return res.status(400).json({
                message: "skip and take must be integers.",
            });
        }

        /* ---------- Database ---------- */

        const response = await findPublicReels(skip, take);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to fetch public reels.",
            });
        }

        return res.status(200).json({
            data: response?.data || response,
        });

    } catch (error) {
        console.error("Get all public reels controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
