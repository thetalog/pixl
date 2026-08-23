const prisma = require("../../lib/prisma");

async function addReelComment(user, reelId, commentText) {
    try {
        console.log(reelId)
        const isReelExist = await prisma.reels.findUnique({
            where: {
                id: reelId
            }
        })
        if (!isReelExist) {
            return { "error": true, "message": "Reel not exist", "status": 500 };

        }
        const newComment = await prisma.reels.update({
            where: { id: reelId },
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
        return { "error": false, "data": newComment, "message": "Comment on reel successful", "status": 201 };
    } catch (error) {
        console.log(error)
        return { "error": true, "message": "Something went wrong", "status": 500 };
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = { addReelComment };