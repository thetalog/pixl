const { PrismaClient, ReactionType } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbLikeOrUnlikePost(user, postId) {
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true },
        });

        if (!post) {
            return { error: true, message: "Post does not exist.", status: 404 };
        }

        const existingReaction = await prisma.reaction.findFirst({
            where: {
                userId: user?.id,
                postId: postId,
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
                postId: postId,
                type: ReactionType.HEART,
            },
        });

        return { error: false, message: "Liked", status: 200 };
    } catch (error) {
        return { error: true, message: "Failed to react post", status: 500 };
    }
}

module.exports = { dbLikeOrUnlikePost };
