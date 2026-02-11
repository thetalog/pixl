const { PrismaClient, ProfileVisibility } = require("@prisma/client");
const prisma = new PrismaClient();

async function generateShareLink(postId) {
    try {
        const response = await prisma.post.findUnique({
            where: {
                id: postId,
            }
        });
        if (response) {
            return { error: false, message: "Fetch succesful.", data: response, status: 200 };
        } else {
            return { error: true, message: "Post not found", status: 404 };
        }
    } catch (error) {
        return { error: true, message: "Fetch Failed.", status: 500 };
    }
}

module.exports = { generateShareLink };
