const { PrismaClient, FollowStatus, ProfileVisibility } = require("@prisma/client");
const prisma = new PrismaClient();

async function sendFollowRequest(user, targetUsername) {
  try {
    if (!user?.id) {
      return { error: true, message: "Unauthorized", status: 401 };
    }

    if (!targetUsername) {
      return { error: true, message: "targetUsername is required", status: 400 };
    }

    if (user?.userName === targetUsername) {
      return { error: true, message: "Cannot request self.", status: 409 };
    }

    const targetUser = await prisma.user.findUnique({
      where: { userName: targetUsername },
      select: {
        id: true,
        userName: true,
        profileVisibility: true,
      },
    });

    if (!targetUser) {
      return { error: true, message: "Receiver not found", status: 404 };
    }

    // ✅ Already followed?
    const alreadyFollowed = await prisma.follow.findUnique({
      where: {
        userId_targetId: {
          userId: user.id,
          targetId: targetUser.id,
        },
      },
    });

    if (alreadyFollowed) {
      return { error: true, message: "Already followed", status: 409 };
    }

    // ✅ PUBLIC → direct follow (no request system)
    if (targetUser.profileVisibility === ProfileVisibility.PUBLIC) {
      await prisma.follow.create({
        data: {
          userId: user.id,
          targetId: targetUser.id,
        },
      });

      return { error: false, message: "Followed successfully", status: 200 };
    }

    // ✅ PRIVATE → create follow request
    const existingRequest = await prisma.followRequest.findUnique({
      where: {
        userId_targetId: {
          userId: user.id,
          targetId: targetUser.id,
        },
      },
    });

    if (existingRequest?.status === FollowStatus.PENDING) {
      return { error: true, message: "Follow request already pending", status: 409 };
    }

    if (existingRequest?.status === FollowStatus.ACCEPTED) {
      return { error: true, message: "Follow request already accepted", status: 409 };
    }

    if (existingRequest?.status === FollowStatus.REJECTED) {
      return { error: true, message: "Follow request already rejected", status: 409 };
    }

    // ✅ create request
    await prisma.followRequest.create({
      data: {
        userId: user.id,
        targetId: targetUser.id,
        status: FollowStatus.PENDING,
      },
    });

    return { error: false, message: "Follow request sent", status: 201 };
  } catch (error) {
    console.log("sendFollowRequest error:", error);
    return { error: true, message: "Follow request failed", status: 500 };
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { sendFollowRequest };
