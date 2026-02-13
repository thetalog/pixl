const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addStoryReaction(userID, storyID) {
  try {
    await prisma.stories.update({
      where: {
        storyId: storyID,
      },
      data: {
        reactions: {
          create: {
            userId: userID,
          },
        },
      },
    });
  } catch (error) {
    return { message: "Story react failed.", error, status: 500 };
  } finally {
    await prisma.$disconnect();
    return { message: "Story react.", status: 200 };
  }
}

module.exports = { addStoryReaction };
