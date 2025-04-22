const { PrismaClient, FollowStatus } = require("@prisma/client");
const { promises } = require("nodemailer/lib/xoauth2");
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
  const isAlreadyFollow = await prisma.follow.findUnique({
    where: {
      targetId: targetUserId,
      userId: user?.id,
    },
  });
  if (!isAlreadyFollow) {
    const response = await prisma.followRequest
      .create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
          target: {
            connect: {
              id: targetUserId,
            },
          },
          status: FollowStatus.pending,
        },
      })
      .then(async (response) => {
        return { message: "Follow Request Sent Successfully", status: 201 };
      })
      .catch((error) => {
        return { message: "Follow Request failed", status: 500 };
      });
  } else {
    return { message: "Already Followed", status: 500 };
  }
  await prisma.$disconnect();
  return response;
}

module.exports = { dbFollowRequest };
