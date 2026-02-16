const { PrismaClient, ProfileVisibility } = require("@prisma/client");
const prisma = new PrismaClient();
async function findPublicReels(skip, take) {
    try {
        const posts = await prisma.reels.findMany({
            where: {
                user: { profileVisibility: ProfileVisibility.PUBLIC },
            },
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
    finally {
        await prisma.$disconnect();
    }
}

module.exports = { findPublicReels };