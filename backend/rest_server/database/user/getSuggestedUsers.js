const { ProfileVisibility } = require("@prisma/client");
const prisma = require("../../lib/prisma");

const userSelect = {
  id: true,
  userName: true,
  name: true,
  profilePic: true,
  bio: true,
  postsCount: true,
  profileVisibility: true,
};

async function getExcludedUserIds(userId) {
  const [follows, pending] = await Promise.all([
    prisma.follow.findMany({
      where: { userId },
      select: { targetId: true },
    }),
    prisma.followRequest.findMany({
      where: { userId, status: "PENDING" },
      select: { targetId: true },
    }),
  ]);

  return new Set([
    userId,
    ...follows.map((f) => f.targetId),
    ...pending.map((r) => r.targetId),
  ]);
}

async function getSuggestedUsers(user, { take = 10 } = {}) {
  try {
    if (!user?.id) {
      return { status: 401, message: "Unauthorized", data: [] };
    }

    const limit = Math.min(Number(take) || 10, 30);
    const excludeIds = await getExcludedUserIds(user.id);

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: [...excludeIds] },
        profileVisibility: ProfileVisibility.PUBLIC,
      },
      select: userSelect,
      orderBy: [{ postsCount: "desc" }, { createdAt: "desc" }],
      take: limit * 2,
    });

    const myFollowing = await prisma.follow.findMany({
      where: { userId: user.id },
      select: { targetId: true },
    });
    const followingIds = myFollowing.map((f) => f.targetId);

    const enriched = [];
    for (const candidate of candidates.slice(0, limit)) {
      let reason = "Suggested for you";
      if (followingIds.length) {
        const mutual = await prisma.follow.count({
          where: {
            userId: { in: followingIds },
            targetId: candidate.id,
          },
        });
        if (mutual === 1) reason = "Followed by someone you follow";
        else if (mutual > 1) reason = `Followed by ${mutual} people you follow`;
      }
      enriched.push({ ...candidate, reason });
    }

    return {
      status: 200,
      message: "Suggested users fetched successfully",
      data: enriched,
    };
  } catch (error) {
    console.error("getSuggestedUsers failed:", error);
    return { status: 500, message: "Failed to fetch suggested users", data: [] };
  }
}

module.exports = { getSuggestedUsers, getExcludedUserIds };
