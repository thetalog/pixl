const { ProfileVisibility } = require("@prisma/client");
const prisma = require("../../lib/prisma");
async function findPublicPosts() {
    try {
        const posts = await prisma.post.findMany({
            where: {
                postDisabled: false,
                user: { profileVisibility: ProfileVisibility.PUBLIC },
            },
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
            },
            orderBy: { createdAt: "desc" },
            take: 20,
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

module.exports = { findPublicPosts };