const { PrismaClient, ReactionType } = require("@prisma/client");
const prisma = new PrismaClient();

async function toggleReelLike(user, reelId) {
    try {
        const reel = await prisma.reels.findUnique({
            where: { id: reelId },
            select: { id: true },
        });

        if (!reel) {
            return { error: true, message: "Reel does not exist.", status: 404 };
        }

        const existingReaction = await prisma.reaction.findFirst({
            where: {
                userId: user?.id,
                reelId: reelId,
                type: ReactionType.HEART
            },
        });

        if (existingReaction) {
            // ✅ unlike (remove like)
            await prisma.reaction.delete({
                where: { id: existingReaction.id },
            });

            return { error: false, message: "Unliked", status: 200 };
        }

        // ✅ like
        await prisma.reaction.create({
            data: {
                userId: user.id,
                reelId: reelId,
                type: ReactionType.HEART,
            },
        });

        return { error: false, message: "Liked", status: 200 };
    } catch (error) {
        return { error: true, message: "Failed to react reel", status: 500 };
    }
}

module.exports = { toggleReelLike };
