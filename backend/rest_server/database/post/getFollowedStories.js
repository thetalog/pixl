const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getFollowedStories(user, skip = 0, take = 20) {
  try {
    // 1️⃣ Get IDs of followed users
    const followedUsers = await prisma.follow.findMany({
      where: {
        userId: user.id,
      },
      select: {
        targetId: true,
      },
    });

    const followedUserIds = followedUsers.map(f => f.targetId);

    // If user follows no one
    if (followedUserIds.length === 0) {
      return {
        message: "No followed stories found",
        status: 200,
        data: [],
      };
    }

    // 2️⃣ Fetch stories from followed users
    const stories = await prisma.stories.findMany({
      where: {
        userId: {
          in: followedUserIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            profilePic: true,
          },
        },
        media: true,
        seen: {
          where: {
            userId: user.id, // ✅ current viewer
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    });

    const formattedStories = stories.map(story => ({
      ...story,
      isSeen:
        story.userId.toString() === user.id.toString() || // creator
        story.seen.length > 0, // viewer has seen
    }));

    return {
      message: "Followed users stories fetched successfully",
      status: 200,
      data: formattedStories,
    };
  } catch (error) {
    console.error("Error in getFollowedStories:", error);
    return {
      message: "Failed to fetch followed stories",
      status: 500,
    };
  }
}

module.exports = { getFollowedStories };
