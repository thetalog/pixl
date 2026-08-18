const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getSavedPosts(user) {
  try {
    const rows = await prisma.savedPost.findMany({
      where: { userId: user?.id },
      include: {
        post: {
          include: {
            media: true,
            user: {
              select: {
                userName: true,
                profilePic: true,
              },
            },
            savedBy: {
              where: { userId: user.id },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      message: "Saved posts fetched successfully",
      status: 200,
      data: rows.map((row) => row.post).filter(Boolean),
    };
  } catch (error) {
    console.error("getSavedPosts failed:", error);
    return { message: "Failed to fetch saved posts", status: 500, data: [] };
  }
}

module.exports = { getSavedPosts };
