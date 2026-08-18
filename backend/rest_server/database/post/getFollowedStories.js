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

    // Always include self so creator can see their own stories.
    const storyOwnerIds = Array.from(new Set([...followedUserIds, user.id]));

    // 2️⃣ Fetch stories (without including media relation to avoid hard failures
    // when orphaned mediaId exists in Stories due to deleted Media collection).
    const stories = await prisma.stories.findMany({
      where: {
        userId: {
          in: storyOwnerIds,
        },
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        mediaId: true,
        user: {
          select: {
            id: true,
            userName: true,
            profilePic: true,
          },
        },
        seen: {
          where: {
            userId: user.id, // ✅ current viewer
          },
          select: {
            id: true,
          },
        },
        reactions: {
          where: {
            userId: user.id,
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

    // 3️⃣ Fetch media separately and attach. Missing media -> filter story out.
    const mediaIds = stories
      .map(s => s.mediaId)
      .filter(Boolean);

    const mediaList = mediaIds.length
      ? await prisma.media.findMany({
        where: {
          id: { in: mediaIds },
        },
      })
      : [];

    const mediaById = new Map(mediaList.map(m => [m.id.toString(), m]));

    const formattedStories = stories
      .map(story => {
        const media = mediaById.get(story.mediaId?.toString() ?? "") ?? null;
        return {
          ...story,
          media,
          isSeen:
            story.userId.toString() === user.id.toString() || // creator
            story.seen.length > 0, // viewer has seen
          isLiked: Array.isArray(story.reactions) && story.reactions.length > 0,
        };
      })
      // Filter out stories whose media is missing/orphaned.
      .filter(story => story.media);

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
