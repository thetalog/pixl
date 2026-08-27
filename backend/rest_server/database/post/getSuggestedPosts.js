const { ProfileVisibility } = require("@prisma/client");
const prisma = require("../../lib/prisma");
const { getExcludedUserIds } = require("../user/getSuggestedUsers");

async function findSuggestedPosts(user, { take = 12, skip = 0 } = {}) {
  try {
    if (!user?.id) {
      return { status: 401, message: "Unauthorized", data: [] };
    }

    const limit = Math.min(Number(take) || 12, 24);
    const offset = Math.max(Number(skip) || 0, 0);
    const excludeIds = await getExcludedUserIds(user.id);

    const posts = await prisma.post.findMany({
      where: {
        postDisabled: false,
        userId: { notIn: [...excludeIds] },
        user: { profileVisibility: ProfileVisibility.PUBLIC },
      },
      include: {
        media: true,
        user: {
          select: {
            id: true,
            userName: true,
            name: true,
            profilePic: true,
            profileVisibility: true,
          },
        },
        reactions: {
          where: { userId: user.id },
          select: { id: true, type: true, createdAt: true },
        },
        savedBy: {
          where: { userId: user.id },
          select: { id: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    const data = posts.map((post) => ({
      ...post,
      userTags: post.userTags || [],
      taggedUsers: post.taggedUsers || [],
      systemTags: post.systemTags || [],
      suggested: true,
      topic:
        (post.userTags && post.userTags[0]) ||
        (post.systemTags && post.systemTags[0]) ||
        "",
    }));

    return {
      status: 200,
      message: "Suggested posts fetched successfully",
      data,
    };
  } catch (error) {
    console.error("findSuggestedPosts failed:", error);
    return { status: 500, message: "Failed to fetch suggested posts", data: [] };
  }
}

module.exports = { findSuggestedPosts };
