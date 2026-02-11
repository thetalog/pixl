const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbApproveIncomingRequest(user, targetUsername) {
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

        if (request.status === FollowStatus.REJECTED) {
            return {
                error: true,
                message: "Follow Request already Rejected!",
                status: 409,
            };
        }

        if (request.status === FollowStatus.ACCEPTED) {
            return {
                error: true,
                message: "Follow Request already Accepted!",
                status: 409,
            };
        }

        // ✅ Everything safe in transaction
        await prisma.$transaction(async (tx) => {
            // mark accepted
            await tx.followRequest.update({
                where: {
                    userId_targetId: {
                        userId: targetUser.id,
                        targetId: user.id,
                    },
                },
                data: {
                    status: FollowStatus.ACCEPTED,
                },
            });

            // create follow (unique constraint might throw)
            await tx.follow.create({
                data: {
                    userId: targetUser.id,
                    targetId: user.id,
                },
            });

            // ✅ optional: delete request after accepting
            // If you want history, comment this out.
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
            message: "Follow Request Accepted!",
            status: 200,
        };
    } catch (error) {
        console.log("dbApproveIncomingRequest error:", error);

        // follow already exists (unique constraint)
        if (error?.code === "P2002") {
            return { error: true, message: "Already following!", status: 409 };
        }

        return { error: true, message: "Follow Request Accept failed", status: 500 };
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = { dbApproveIncomingRequest };
