const {
    getGroupConversations,
} = require("../../../database/message/group/getConversations");

function _parseIntOrDefault(value, defaultValue) {
    const n = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(n) && n >= 0 ? n : defaultValue;
}

exports.getGroupConversationsController = async (req, res) => {
    try {
        const user = req.user;
        const { skip, take } = req.query;

        const parsedSkip = _parseIntOrDefault(skip, 0);
        const parsedTake = _parseIntOrDefault(take, 50);

        const response = await getGroupConversations(user, parsedSkip, parsedTake);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Fetch group conversations failed.",
            });
        }

        if (response?.status === 401) {
            return res.status(401).json({
                message: response.message,
            });
        }

        return res.status(200).json({
            conversations: response?.conversations ?? [],
        });
    } catch (error) {
        console.error("Get group conversations controller error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};
