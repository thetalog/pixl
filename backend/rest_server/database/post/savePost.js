const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function toggleSavePost(user, postId) {
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true },
        });

        if (!post) {
            return { error: true, message: "Post does not exist.", status: 404 };
        }

        const existingSave = await prisma.savedPost.findFirst({
            where: {
                userId: user?.id,
                postId: postId,
            },
            select: { id: true },
        });

        if (existingSave) {
            await prisma.savedPost.delete({
                where: { id: existingSave.id },
            });

            return { error: false, message: "Unsaved", status: 200 };
        }

        await prisma.savedPost.create({
            data: {
                userId: user.id,
                postId: postId,
            },
        });

        return { error: false, message: "Saved", status: 200 };
    } catch (error) {
        return { error: true, message: "Failed to save post", status: 500 };
    }
}

module.exports = { toggleSavePost };
