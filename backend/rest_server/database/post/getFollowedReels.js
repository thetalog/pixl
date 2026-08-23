const prisma = require("../../lib/prisma");

async function findReelComments(user, reelId, skip, take) {
    try {
        const comments = await prisma.comment.findMany({
            where: {
                reelId: reelId, // ✅ best (if you have postId field)
            },
            include: {
                user: {
                    select: {
                        profilePic: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc", // ✅ optional (recommended)
            },
            skip: skip,
            take: take
        });

        return {
            message: "Reel comments fetched successfully",
            status: 200,
            data: comments,
        };
    } catch (error) {
        console.error("Error in dbGetAllFollowedReelComments:", error);
        return { message: "Failed to fetch reel comments", status: 500 };
    }
}

module.exports = { findReelComments };
