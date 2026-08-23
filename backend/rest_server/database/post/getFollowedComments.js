const prisma = require("../../lib/prisma");

async function findPostComments(user, postId, skip, take) {
    try {
        const comments = await prisma.comment.findMany({
            where: {
                postId: postId, // ✅ best (if you have postId field)
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
            message: "Post comments fetched successfully",
            status: 200,
            data: comments,
        };
    } catch (error) {
        console.error("Error in dbGetAllFollowedPostComments:", error);
        return { message: "Failed to fetch post comments", status: 500 };
    }
}

module.exports = { findPostComments };
