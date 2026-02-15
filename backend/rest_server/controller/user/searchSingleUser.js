const { getUserByUsername } = require("../../database/user/search");

exports.searchUserController = async (req, res) => {
    try {
        const query = req.query.username;

        /* ================= VALIDATION ================= */

        if (!query) {
            return res.status(400).json({
                message: "Username is required.",
            });
        }

        /* ================= DATABASE ================= */

        const user = await getUserByUsername(req?.user, query);

        if (!user) {
            return res.status(200).json({});
        }

        /* ================= RESPONSE ================= */

        return res.status(200).json({
            error: false,
            data: user,
            message: "User retrieved successfully.",
        });
    } catch (error) {
        console.error("Search controller error:", error);

        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
