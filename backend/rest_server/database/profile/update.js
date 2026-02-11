const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateProfile(user, changeName = "", changeUsername = "", changePassword = "", oldPassword = "") {
    try {
        var response;
        if (changeName !== null && changeName !== undefined) {
            response = await prisma.user.update({
                where: {
                    id: user?.id
                },
                data: {
                    name: changeName
                }
            });
        } else if (changeUsername !== null && changeUsername !== undefined) {
            response = await prisma.user.update({
                where: {
                    id: user?.id,
                },
                data: {
                    userName: changeUsername
                }
            });
        } else if (changePassword !== null && changePassword !== undefined) {
            const oldPasswordHashed = crypto
                .createHash("sha3-512")
                .update(oldPassword)
                .digest("hex");
            const changePasswordHashed = crypto
                .createHash("sha3-512")
                .update(changePassword)
                .digest("hex");
            if (changePasswordHashed == oldPasswordHashed || oldPasswordHashed !== user?.password) {
                return { status: 400, message: "Password does not match or entered old password", error: true }
            }
            response = await prisma.user.update({
                where: {
                    id: user?.id
                },
                data: {
                    password: changePasswordHashed
                }
            });
        } else {
            return { status: 400, message: "Something went wrong", error: true }
        }
        return { status: 200, message: "Update Successful", error: true, details: response };
    } catch (error) {
        console.log(error);
        return [];
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = { updateProfile };
