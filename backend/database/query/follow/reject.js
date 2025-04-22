const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbFollowReject(user, requestId, requesterUsername) {
  const getRequesterUser = await prisma.user.findUnique({
    where: {
      userName: requesterUsername,
    },
  });
  if (!getRequesterUser) {
    return { message: "Requester not found", status: 404 };
  }
  const requesterId = getRequesterUser.id;
  const getFollowRequest = await prisma.followRequest.findUnique({
    where: {
      id: requestId,
      targetId: user?.id,
      userId: requesterId,
    },
  });
  if (!getFollowRequest) {
    return { message: "Request not found", status: 404 };
  }
  const response = await prisma.followRequest
    .update({
      where: {
        id: requestId,
        targetId: user?.id,
        userId: requesterId,
      },
      data: {
        status: FollowStatus.REJECTED,
      },
    })
    .then(async (response) => {
      return { message: "Follow Request Rejected Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Follow Request reject failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbFollowReject };
