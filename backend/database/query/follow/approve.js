const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbApproveFollow(user, requestId, requesterUsername) {
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
        status: FollowStatus.ACCEPTED,
      },
    })
    .then(async (response) => {
      await prisma.follow
        .create({
          data: {
            target: {
              connect: {
                id: user?.id,
              },
            },
            user: {
              connect: {
                id: requesterId,
              },
            },
          },
        })
        .then(async (response) => {
          return {
            message: "Follow Request Accepted Successfully",
            status: 201,
          };
        })
        .catch((error) => {
          console.log(error);
          return { message: "Follow Request Accepted failed", status: 500 };
        });
    })
    .catch((error) => {
      console.log(error);
      return { message: "Follow Request Accepted failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbApproveFollow };
