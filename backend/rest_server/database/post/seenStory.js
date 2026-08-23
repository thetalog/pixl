const prisma = require("../../lib/prisma");

async function markStoriesAsSeen(userId, storyId) {
    try {
        // 1️⃣ Fetch story owner
        const story = await prisma.stories.findUnique({
            where: { id: storyId },
            select: { userId: true },
        });

        if (!story) {
            return {
                error: true,
                message: "Story not found",
                status: 404,
            };
        }

        // 2️⃣ Validation: creator cannot see own story
        if (story.userId.toString() === userId.toString()) {
            return {
                error: false,
                data: null,
                message: "Story creator cannot see own story",
                status: 200,
            };
        }

        // 3️⃣ Mark as seen (upsert)
        const seen = await prisma.storiesSeen.upsert({
            where: {
                userId_storyId: {
                    userId,
                    storyId,
                },
            },
            update: {},
            create: {
                userId,
                storyId,
            },
        });

        return {
            error: false,
            data: seen,
            message: "Seen successful",
            status: 201,
        };
    } catch (error) {
        console.error(error);
        return {
            error: true,
            message: "Something went wrong",
            status: 500,
        };
    }
}

module.exports = { markStoriesAsSeen };
