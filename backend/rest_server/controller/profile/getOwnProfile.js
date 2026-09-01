const { sanitizeUser } = require("../../lib/admin/sanitize");
const { staffCapabilities, isStaff } = require("../../lib/admin/authorize");
const { isAccountBlocked } = require("../../lib/admin/restrictions");

exports.getOwnProfileController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const details = sanitizeUser(req.user, { includeStaff: isStaff(req.user) });
        const block = isAccountBlocked(req.user);
        return res.status(200).json({
            message: "User found!",
            details: {
                ...details,
                capabilities: isStaff(req.user) ? staffCapabilities(req.user) : { roleKey: details.roleKey || "USER", isStaff: false, permissions: [] },
                accountBlock: block.blocked ? { code: block.code, message: block.message, until: block.until || null } : null,
                impersonating: Boolean(req.impersonating),
            },
            status: 200,
        });

    } catch (error) {
        console.error("Get own profile controller error:", error);

        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
