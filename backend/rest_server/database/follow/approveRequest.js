const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function approveFollowRequest(user, requestId, requesterUsername) {
    try {
        if (!user?.id) {
            return { error: true, message: "Unauthorized", status: 401 };
        }

        const requester = await prisma.user.findUnique({
            where: { userName: requesterUsername },
            select: { id: true },
        });

        if (!requester) {
            return { error: true, message: "Requester not found!", status: 404 };
        }

        const request = await prisma.followRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            return { error: true, message: "Follow request not found!", status: 404 };
        }

        // 🔐 Security check
        if (
            request.userId !== requester.id ||
            request.targetId !== user.id
        ) {
            return { error: true, message: "Invalid request!", status: 403 };
        }

        if (request.status === FollowStatus.ACCEPTED) {
            return { error: true, message: "Already accepted!", status: 409 };
        }

        if (request.status === FollowStatus.REJECTED) {
            return { error: true, message: "Already rejected!", status: 409 };
        }

        // ✅ ONE TRANSACTION
        await prisma.$transaction(async (tx) => {

            // Create follow
            await tx.follow.create({
                data: {
                    userId: requester.id,
                    targetId: user.id,
                },
            });

            // Delete follow request (no need to keep ACCEPTED)
            await tx.followRequest.delete({
                where: { id: requestId },
            });
        });

        return {
            error: false,
            message: "Follow approved successfully",
            status: 200,
        };

    } catch (error) {
        console.log("approveFollowRequest error:", error);

        if (error?.code === "P2002") {
            return { error: true, message: "Already following!", status: 409 };
        }

        return { error: true, message: "Approval failed", status: 500 };
    }
}

module.exports = { approveFollowRequest };