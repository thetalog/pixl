const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function cancelFollowRequest(user, targetUsername) {
    try {
        if (!user?.id) {
            return { error: true, message: "Unauthorized", status: 401 };
        }

        const targetUser = await prisma.user.findUnique({
            where: { userName: targetUsername },
            select: { id: true, userName: true },
        });
        // userId = sender, targetId = receiver
        const request = await prisma.followRequest.findUnique({
            where: {
                userId_targetId: {
                    userId: targetUser.id,
                    targetId: user.id,
                },
            },
        });

        if (!request) {
            return { error: true, message: "No follow request found!", status: 404 };
        }


        // ✅ Transaction = safe + consistent
        await prisma.$transaction(async (tx) => {
            await tx.followRequest.delete({
                where: {
                    userId_targetId: {
                        userId: targetUser.id,
                        targetId: user.id,
                    },
                },
            });
        });

        return {
            error: false,
            message: "Follow Request Removed!",
            status: 200,
        };
    } catch (error) {
        return { error: true, message: "Follow Request Remove failed", status: 500 };
    }
}

module.exports = { cancelFollowRequest };
