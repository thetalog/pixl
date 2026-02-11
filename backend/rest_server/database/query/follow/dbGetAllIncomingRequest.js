const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbGetAllIncomingRequest(user) {
    const response = await prisma.followRequest
        .findMany({
            where: {
                targetId: user?.id,
                status: FollowStatus.PENDING
            },
        })
        .then(async (response) => {
            if (response.length !== 0) {
                return { error: false, message: "Request Pending", details: response, status: 200 };
            }
            return { error: false, message: "No Request Pending", details: response.status, status: 200 };
        })
        .catch((error) => {
            console.log(error);
            return { error: true, message: "Follow Request Reject failed", status: 500 };
        });
    await prisma.$disconnect();
    return response;
}

module.exports = { dbGetAllIncomingRequest };
