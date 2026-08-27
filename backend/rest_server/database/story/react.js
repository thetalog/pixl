const prisma = require("../../lib/prisma");

async function toggleStoryLike(user, storyId) {
  try {
    const story = await prisma.stories.findUnique({
      where: { id: storyId },
      select: { id: true },
    });

    if (!story) {
      return { error: true, message: "Story does not exist.", status: 404 };
    }

    const existing = await prisma.storiesReactions.findFirst({
      where: {
        userId: user?.id,
        storyId,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.storiesReactions.delete({ where: { id: existing.id } });
      return { error: false, message: "Unliked", status: 200 };
    }

    await prisma.storiesReactions.create({
      data: {
        userId: user.id,
        storyId,
      },
    });

    return { error: false, message: "Liked", status: 200 };
  } catch (error) {
    console.error("toggleStoryLike failed:", error);
    return { error: true, message: "Failed to react to story", status: 500 };
  }
}

module.exports = { toggleStoryLike };
