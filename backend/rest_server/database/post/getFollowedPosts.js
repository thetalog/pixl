const prisma = require("../../lib/prisma");

async function findFollowedPosts(user) {
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

        // Include the current user so their own posts appear in the feed.
        const followedIds = Array.from(
            new Set([...followedUsers.map((f) => f.targetId), user?.id].filter(Boolean))
        );

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
                // ✅ only include MY save (if exists)
                savedBy: {
                    where: { userId: user.id },
                    select: {
                        id: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Note: Prisma client must be regenerated after schema changes.

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
    }
}

module.exports = { findFollowedPosts };
