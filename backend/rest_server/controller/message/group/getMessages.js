const { getGroupMessages } = require("../../../database/message/group/getMessages");

function _parseIntOrDefault(value, defaultValue) {
    const n = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(n) && n >= 0 ? n : defaultValue;
}

exports.getGroupMessagesController = async (req, res) => {
    try {
        const user = req.user;
        const { groupId, skip, take } = req.query;

        /* ================= VALIDATION ================= */

        if (!groupId) {
            return res.status(400).json({
                message: "groupId is required",
            });
        }

        const parsedSkip = _parseIntOrDefault(skip, 0);
        const parsedTake = _parseIntOrDefault(take, 50);

        /* ================= DATABASE ================= */

        const response = await getGroupMessages(user, String(groupId), parsedSkip, parsedTake);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Fetch group messages failed.",
            });
        }

        if (response?.status === 404) {
            return res.status(404).json({
                message: response.message,
            });
        }

        if (response?.status === 403) {
            return res.status(403).json({
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
            group: response?.group,
            messages: response?.messages ?? [],
        });
    } catch (error) {
        console.error("Get group messages controller error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};
