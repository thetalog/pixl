const {
    getDirectMessages,
} = require("../../../database/message/direct/getMessages");

function _parseIntOrDefault(value, defaultValue) {
    const n = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(n) && n >= 0 ? n : defaultValue;
}

exports.getDirectMessagesController = async (req, res) => {
    try {
        const user = req.user;
        const { targetUsername, skip, take } = req.query;

        /* ================= VALIDATION ================= */

        if (!targetUsername) {
            return res.status(400).json({
                message: "targetUsername is required",
            });
        }

        const parsedSkip = _parseIntOrDefault(skip, 0);
        const parsedTake = _parseIntOrDefault(take, 50);

        /* ================= DATABASE ================= */

        const response = await getDirectMessages(
            user,
            String(targetUsername),
            parsedSkip,
            parsedTake
        );

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Fetch direct messages failed.",
            });
        }

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message,
            });
        }

        if (response?.status === 400) {
            return res.status(400).json({
                message: response.message,
            });
        }

        /* ================= SUCCESS ================= */

        return res.status(200).json({
            messages: response?.messages ?? [],
        });
    } catch (error) {
        console.error("Get direct messages controller error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};
