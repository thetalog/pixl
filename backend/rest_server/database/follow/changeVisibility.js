const { FollowStatus } = require("@prisma/client");
const prisma = require("../../lib/prisma");

async function toggleProfileVisibility(user, targetUsername, action) {
    var currentVisibility = await prisma.user.findUnique({
        where: {
            id: user?.id
        }, select: {
            profileVisibility: true
        }
    })
    const response = await prisma.user
        .update({
            where: {
                id: user?.id
            },
            data: {
                profileVisibility: currentVisibility?.profileVisibility === "PUBLIC" ? "PRIVATE" : currentVisibility?.profileVisibility === "PRIVATE" ? "PUBLIC" : "PRIVATE"
            }
        })
        .then(async (response) => {
            return { error: false, message: "Change request succesful", details: response.status, status: 201 };
        })
        .catch((error) => {
            return { error: true, message: "Change request failed", status: 500 };
        });
    await prisma.$disconnect();
    return response;
}

module.exports = { toggleProfileVisibility };
