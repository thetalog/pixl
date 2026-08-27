const { searchUsers } = require("../../database/user/search");
const { updateProfile } = require("../../database/profile/update");

exports.updateProfileController = async (req, res) => {
    try {
        /* ================= VALIDATION ================= */

        const {
            name,
            about,
            oldPassword,
            newPassword,
        } = req.query;

        if (
            !name &&
            !about &&
            !(oldPassword && newPassword)
        ) {
            return res.status(400).send({
                message: "At least one field is required to update.",
            });
        }

        /* ================= CHECK USER EXISTS ================= */

        const user = await searchUsers(req.user);

        if (!user || user.length === 0) {
            return res.status(404).send({
                message: "User not found.",
            });
        }

        /* ================= UPDATE PROFILE ================= */

        const updateProfileResponse = await updateProfile(
            req.user,
            name,
            about,
            oldPassword,
            newPassword
        );

        return res
            .status(updateProfileResponse?.status)
            .send(updateProfileResponse);

    } catch (error) {
        console.error("Update profile controller error:", error);

        return res.status(500).send({
            message: "Internal Server Error",
        });
    }
};
