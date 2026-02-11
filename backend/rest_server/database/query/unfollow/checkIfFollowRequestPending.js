const { PrismaClient, FollowStatus } = require("@prisma/client");
const { promises } = require("nodemailer/lib/xoauth2");
const prisma = new PrismaClient();

async function dbCheckIfFollowRequestPending(user, targetUsername) {
  const getTargetUser = await prisma.user.findUnique({
    where: {
      userName: targetUsername,
    },
  });
  if (!getTargetUser) {
    return { message: "User not found", status: 404 };
  }
  const targetUserId = getTargetUser.id;
  const isRequestPending = await prisma.followRequest.findUnique({
    where: {
      targetId: targetUserId,
      userId: user?.id,
    },
  });
  await prisma.$disconnect();
  if (!isRequestPending) {
    return { message: "Not Pending", status: 406 };
  } else {
    return { message: "Already Pending", status: 200 };
  }
}

module.exports = { dbCheckIfFollowRequestPending };
