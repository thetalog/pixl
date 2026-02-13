const { PrismaClient, ProfileVisibility } = require("@prisma/client");
const prisma = new PrismaClient();

async function getPostsByCategory(uiCategory) {
    try {
        const response = await prisma.post.findMany({
            where: {
                uiCategory: uiCategory, user: {
                    profileVisibility: ProfileVisibility.PUBLIC
                },
            },
            include: {
                mentions: true,
                comments: true,
                media: true
            }
        });
        return { error: false, message: "Fetch succesful.", data: response, status: 200 };
    } catch (error) {
        console.log(error)
        return { error: true, message: "Fetch Failed.", status: 500 };
    }
}

module.exports = { getPostsByCategory };
