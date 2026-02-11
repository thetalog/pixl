const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbGetAllFollowedPosts(user) {
    try {
        // 1) Get all users that this user follows
        const followedUsers = await prisma.follow.findMany({
            where: {
                userId: user?.id,
            },
            select: {
                targetId: true,

            },
        });

        // 2) Convert to array of ids
        const followedIds = followedUsers.map((f) => f.targetId);

        // If user follows nobody
        if (followedIds.length === 0) {
            return {
                message: "Followed posts fetched successfully",
                status: 200,
                data: [],
            };
        }

        // 3) Get posts by followed users
        const posts = await prisma.post.findMany({
            where: {
                userId: { in: followedIds },
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
                user: {
                    select: {
                        userName: true,
                        profilePic: true,
                    }
                },
                // ✅ only include MY reaction (if exists)
                reactions: {
                    where: { userId: user.id },
                    select: {
                        id: true,
                        type: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Map to include tags and taggedUsers
        const postsWithTags = posts.map(post => ({
            ...post,
            userTags: post.userTags || [],
            taggedUsers: post.taggedUsers || [],
        }));

        return {
            message: "Followed posts fetched successfully",
            status: 200,
            data: postsWithTags,
        };
    } catch (error) {
        console.error("Error in dbGetAllFollowedPosts:", error);
        return { message: "Failed to fetch followed posts", status: 500 };
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = { dbGetAllFollowedPosts };
