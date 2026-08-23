const prisma = require("../../lib/prisma");

async function createStory(userId, mediaURL, mentionIDs) {
  const response = await prisma.stories
    .create({
      data: {
        userId: userId,
        mediaURL: mediaURL,
        mentions: {
          createMany: {
            data: mentionIDs.map((userId) => ({ userId })),
          },
        },
      },
    })
    .catch((error) => {
      return { message: "Upload Story failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { createStory };
