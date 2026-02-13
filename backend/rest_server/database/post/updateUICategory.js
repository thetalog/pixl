const { PrismaClient, UICategory } = require("@prisma/client");
const prisma = new PrismaClient();

async function updatePostCategory(postId, uiCategory) {
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true },
        });

        if (!post) {
            return { error: true, message: "Post does not exist.", status: 404 };
        }

        let category = uiCategory in UICategory;
        if (!category) {
            return { error: true, message: "Not a UI Category", status: 500 };

        }

        // ✅ unlike (remove like)
        await prisma.post.update({
            where: { id: postId },
            data: {
                uiCategory: uiCategory
            }
        });

        return { error: false, message: "update successful post UI Category.", status: 200 };
    } catch (error) {
        console.log(error)
        return { error: true, message: "Failed to post UI Category.", status: 500 };
    }
}

module.exports = { updatePostCategory };
