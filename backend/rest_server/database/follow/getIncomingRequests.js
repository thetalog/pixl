const { FollowStatus } = require("@prisma/client");
const prisma = require("../../lib/prisma");

async function getIncomingFollowRequests(user) {
    try {
        if (!user?.id) {
            return { error: true, message: "Unauthorized", status: 401, data: [] };
        }

        const requests = await prisma.followRequest.findMany({
            where: {
                targetId: user.id,
                status: FollowStatus.PENDING,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        userName: true,
                        name: true,
                        profilePic: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            error: false,
            message: requests.length ? "Request Pending" : "No Request Pending",
            data: requests,
            details: requests,
            status: 200,
        };
    } catch (error) {
        console.log(error);
        return { error: true, message: "Follow Request fetch failed", status: 500, data: [] };
    } finally {    }
}

module.exports = { getIncomingFollowRequests };
