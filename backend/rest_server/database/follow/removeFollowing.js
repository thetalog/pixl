const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function unfollowUser(user, targetUsername) {
    try {
        if (!user?.id) {
            return { error: true, message: "Unauthorized", status: 401 };
        }

        const targetUser = await prisma.user.findUnique({
            where: { userName: targetUsername },
            select: { id: true, userName: true },
        });
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
            return { error: true, message: "No follow found!", status: 404 };
        }


        // ✅ Transaction = safe + consistent
        await prisma.$transaction(async (tx) => {
            await tx.follow.delete({
                where: {
                    userId_targetId: {
                        userId: user.id,
                        targetId: targetUser.id,
                    },
                },
            });
        });

        return {
            error: false,
            message: "Following Removed!",
            status: 200,
        };
    } catch (error) {
        console.log("DB Remove Following Error:", error);
        return { error: true, message: "Following Remove failed", status: 500 };
    }
}

module.exports = { unfollowUser };
