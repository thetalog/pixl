const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getUserPostCount(userId) {
    let response = await prisma.stories
        .findMany({
            where: {
                userId: userId
            }
        })
        .then((response) => {
            return {
                message: "Stories fetched Successfully",
                status: 201,
                data: response.length,
            };
        })
        .catch((error) => {
            return { message: "Stories fetched failed", status: 500 };
        });

    await prisma.$disconnect();
    return response;
}

module.exports = { getUserPostCount };
