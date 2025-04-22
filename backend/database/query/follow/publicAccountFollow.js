const { PrismaClient, FollowStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbFollowRequest(user, targetUsername) {
  const getTargetUser = await prisma.user.findUnique({
    where: {
      userName: targetUsername,
    },
  });
  if (!getTargetUser) {
    return { message: "Receiver not found", status: 404 };
  }
  const targetUserId = getTargetUser.id;
  const response = await prisma.follow
    .create({
      data: {
        target: {
          connect: {
            id: targetUserId,
          },
        },
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    })
    .then(async (response) => {
      return { message: "Followed Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Follow failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbFollowRequest };
