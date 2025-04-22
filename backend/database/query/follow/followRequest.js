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
  const receiverId = getTargetUser.id;
  const response = await prisma.followRequest
    .create({
      data: {
        senderId: user.id,
        targetId: receiverId,
        status: FollowStatus.pending,
      },
    })
    .then(async (response) => {
      return { message: "Follow Request Sent Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Follow Request failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbFollowRequest };
