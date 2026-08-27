const prisma = require("../../lib/prisma");

async function markStoryAsSeen(userID, storyID) {
  const response = await prisma.stories
    .update({
      where: {
        id: storyID,
      },
      data: {
        seen: {
          create: {
            userId: userID,
          },
        },
      },
    })
    .catch((error) => {
      return { message: "Story seen failed", status: 500 };
    });  return { message: "Story seen.", status: 200 };
}

module.exports = { markStoryAsSeen };
