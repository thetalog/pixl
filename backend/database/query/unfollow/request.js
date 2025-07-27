const { PrismaClient, FollowStatus } = require("@prisma/client");
const { promises } = require("nodemailer/lib/xoauth2");
const { dbCheckIfFollowRequestPending } = require("./checkIfFollowRequestPending.js");
const prisma = new PrismaClient();

async function dbUnfollowRequest(user, targetUsername) {
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
  if (isAlreadyFollow) {
    const response = await prisma.follow
      .update({
        where: {
            targetId: targetUserId,
            userId: user.id,
        },
        data: {
          status: FollowStatus.UNFOLLOWED,
        },
      })
      .then(async (response) => {
        return { message: "Unfollowed Successfull", status: 201 };
      })
      .catch((error) => {
        return { message: "Unfollow Request failed", status: 500 };
      });
  } else {
    const isRequestPending = await dbCheckIfFollowRequestPending(user, targetUsername);
    if (isRequestPending.status === 200) {
        try{
            await prisma.followRequest.delete({
                where: {
                targetId: targetUserId,
                userId: user.id,
                },
            });
          return { message: "Follow Request Cancelled", status: 200 };
        }
        catch (error) {
          return { message: "Failed to cancel follow request", status: 500 };
        }
    }
    else {
      return { message: "Something went wrong", status: 404 };
    }
  }
  await prisma.$disconnect();
  return response;
}

module.exports = { dbUnfollowRequest };
