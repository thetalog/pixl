const { changeProfileVisibility } = require("../../database/follow/changeVisibility");

exports.changeProfileVisibilityController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        /* ================= DATABASE ================= */

        const response = await changeProfileVisibility(req.user);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to change profile visibility.",
            });
        }

        /* ================= RESPONSE ================= */

        return res.status(200).json({
            message: "Profile visibility updated successfully.",
            data: response?.data || null,
        });

    } catch (error) {
        console.error("Change profile visibility controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
