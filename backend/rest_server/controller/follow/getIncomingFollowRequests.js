const { getIncomingFollowRequests } = require("../../database/follow/getIncomingRequests");

exports.getIncomingFollowRequestsController = async (req, res) => {
    try {
        /* ================= DATABASE ================= */

        const response = await getIncomingFollowRequests(req.user);

        if (response?.status === 500) {
            return res.status(500).json({
                message: "Failed to fetch incoming follow requests.",
            });
        }

        /* ================= RESPONSE ================= */

        return res.status(200).json({
            message: "Incoming follow requests fetched successfully.",
            data: response?.data || [],
        });

    } catch (error) {
        console.error("Get incoming follow requests controller error:", error);

        return res.status(500).json({
            message: "Something went wrong.",
        });
    }
};
