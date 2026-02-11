const { searchUsers } = require("../../database/query/user/searchUsers");

exports.searchUsersController = async (req, res) => {
    try {
        /* ================= GET QUERY ================= */

        const query = req.query.username || req.query.name || req.query.q;

        /* ================= VALIDATION ================= */

        if (!query || query.trim() === "") {
            return res.status(400).json({
                message: "Username or name query parameter is required.",
            });
        }

        /* ================= DATABASE ================= */

        const users = await searchUsers(query);

        if (!users || users.length === 0) {
            return res.status(200).json([]);
        }

        /* ================= RESPONSE ================= */

        return res.status(200).json(users);
    } catch (error) {
        console.error("Search users controller error:", error);

        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
