const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbDeleteStory(userID, storyID) {
  try {
    const response = await prisma.$transaction([
      prisma.storiesMentions.deleteMany({
        where: {
          storyId: storyID,
        },
      }),
      prisma.storiesReactions.deleteMany({
        where: {
          storyId: storyID,
        },
      }),
      prisma.storiesSeen.deleteMany({
        where: {
          storyId: storyID,
        },
      }),
      prisma.stories.delete({
        where: {
          id: storyID,
          userId: userID,
        },
      }),
    ]);

    return {
      message: "Story and mentions deleted",
      data: response,
      status: 200,
    };
  } catch (error) {
    return { message: "Story deletion failed", error, status: 500 };
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { dbDeleteStory };
