exports.getOwnProfileController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        return res.status(200).json({
            message: "User found!",
            details: req.user,
            status: 200,
        });

    } catch (error) {
        console.error("Get own profile controller error:", error);

        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
