const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbPostComment(user, postId, commentText) {
    try {
        const isPostExist = await prisma.post.findUnique({
            where: {
                id: postId
            }
        })
        if (!isPostExist) {
            return { "error": true, "message": "Post not exist", "status": 500 };

        }
        const newComment = await prisma.post.update({
            where: { id: postId },
            data: {
                comments: {
                    create: {
                        userId: user?.id,
                        text: commentText,
                    },
                }
            },
            include: {
                comments: true,
            },
        });
        return { "error": false, "data": newComment, "message": "Comment on post successful", "status": 201 };
    } catch (error) {
        console.log(error)
        return { "error": true, "message": "Something went wrong", "status": 500 };
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = { dbPostComment };