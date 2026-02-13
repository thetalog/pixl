const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function getFollowStatus(user, targetUsername) {
    try {
        if (!user?.id) {
            return { error: true, message: "Unauthorized", status: 401 };
        }

        const targetUser = await prisma.user.findUnique({
            where: { userName: targetUsername },
            select: { id: true, userName: true },
        });
        var response = {};
        // userId = sender, targetId = receiver
        const followResponse = await prisma.follow.findUnique({
            where: {
                userId_targetId: {
                    userId: user.id,
                    targetId: targetUser.id,
                },
            },
        });
        if (!followResponse) {
            const followRequestResponse = await prisma.followRequest.findUnique({
                where: {
                    userId_targetId: {
                        userId: user.id,
                        targetId: targetUser.id,
                    },
                },
            });
            if (!followRequestResponse) {
                return {
                    error: false,
                    message: "Follow and followrequest not found!",
                    data: { isFollow: false, isRequested: false },
                    status: 200,
                };
            } else {
                return {
                    error: false,
                    message: "Followrequest found!",
                    data: { isFollow: false, isRequested: true },
                    status: 200,
                };
            }
        } else {
            return {
                error: false,
                message: "Followrequest found!",
                data: { isFollow: true, isRequested: false },
                status: 200,
            };
        }

    } catch (error) {
        return { error: true, message: "Following Remove failed", status: 500 };
    }
}

module.exports = { getFollowStatus };
