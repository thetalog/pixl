const { ProfileVisibility } = require("@prisma/client");
const prisma = require("../../lib/prisma");

async function findPostById(postId) {
    try {
        if (!postId || postId.trim() === "") {
            return {
                message: "Invalid postId",
                status: 400,
                data: null,
            };
        }

        const posts = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                media: true,
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                profilePic: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        userName: true,
                        profilePic: true,
                    }
                },
            },
        });
        return {
            message: "Public posts fetched successfully",
            status: 200,
            data: posts,
        };
    } catch (error) {
        console.error("Error in dbGetAllPublicPosts:", error);
        return { message: "Failed to fetch public posts", status: 500 };
    }
    finally {
        await prisma.$disconnect();
    }
}

module.exports = { findPostById };