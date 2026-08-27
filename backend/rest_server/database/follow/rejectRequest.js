const { FollowStatus } = require("@prisma/client");
const prisma = require("../../lib/prisma");

async function rejectFollowRequest(user, targetUsername) {
    try {
        if (!user?.id) {
            return { error: true, message: "Unauthorized", status: 401 };
        }

        const targetUser = await prisma.user.findUnique({
            where: { userName: targetUsername },
            select: { id: true, userName: true },
        });

        if (!targetUser?.id) {
            return { error: true, message: "Target user not found!", status: 404 };
        }

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

        if (request.status === FollowStatus.ACCEPTED) {
            return {
                error: true,
                message: "Follow Request already Accepted!",
                status: 409,
            };
        }

        if (request.status === FollowStatus.REJECTED) {
            return {
                error: true,
                message: "Follow Request already Rejected!",
                status: 409,
            };
        }

        // ✅ Transaction = safe + consistent
        await prisma.$transaction(async (tx) => {
            // mark rejected
            await tx.followRequest.update({
                where: {
                    userId_targetId: {
                        userId: targetUser.id,
                        targetId: user.id,
                    },
                },
                data: {
                    status: FollowStatus.REJECTED,
                },
            });

            // delete follow relation if it exists
            const follow = await tx.follow.findUnique({
                where: {
                    userId_targetId: {
                        userId: targetUser.id,
                        targetId: user.id,
                    },
                },
            });

            if (follow) {
                await tx.follow.delete({
                    where: {
                        userId_targetId: {
                            userId: targetUser.id,
                            targetId: user.id,
                        },
                    },
                });
            }

            // ✅ optional: delete request record completely
            // If you want "history", remove this block
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
            message: "Follow Request Rejected!",
            status: 200,
        };
    } catch (error) {
        console.log("rejectFollowRequest error:", error);
        return { error: true, message: "Follow Request Reject failed", status: 500 };
    } finally {    }
}

module.exports = { rejectFollowRequest };
