const { ProfileVisibility } = require("@prisma/client");
const prisma = require("../../lib/prisma");
async function findPublicReels(skip, take, user) {
    try {
        const visibilityFilter = user?.id
            ? {
                OR: [
                    { user: { profileVisibility: ProfileVisibility.PUBLIC } },
                    { userId: user.id },
                ],
            }
            : { user: { profileVisibility: ProfileVisibility.PUBLIC } };

        const posts = await prisma.reels.findMany({
            where: visibilityFilter,
            include: {
                user: {
                    select: {
                        id: true,
                        userName: true,
                        profilePic: true,
                    },
                },
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
            skip: skip,
            take: take ? take > 3 ? 3 : take : 3,
        });

        return {
            message: "Public posts fetched successfully",
            status: 200,
            data: posts,
        };
    } catch (error) {
        console.error("Error in dbGetAllPublicReels:", error);
        return { message: "Failed to fetch public posts", status: 500 };
    }
}

module.exports = { findPublicReels };