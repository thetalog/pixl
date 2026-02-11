const { PrismaClient, } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbSystemTags(user, postId, systemTags) {
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true },
        });

        if (!post) {
            return { error: true, message: "Post does not exist.", status: 404 };
        }

        let uniqueTags = [...new Set([...(post?.systemTags ?? []), ...(systemTags ?? [])])];
        if (post?.systemTags?.length > 0) {
            // ✅ unlike (remove like)
            await prisma.post.update({
                where: { id: postId },
                data: {
                    systemTags: {
                        push: uniqueTags
                    }
                }
            });

            return { error: false, message: "update successful post system tags.", status: 200 };
        }

        // ✅ like
        const newSystemTagsResponse = await prisma.post.update({
            where: { id: postId },
            data: {
                systemTags: {
                    set: uniqueTags
                }
            }
        });
        console.log("postId:", postId, typeof postId);
        console.log("UPDATED:", newSystemTagsResponse);
        return { error: false, message: "creation successful post system tags.", status: 200 };
    } catch (error) {
        return { error: true, message: "Failed to post system tags.", status: 500 };
    }
}

module.exports = { dbSystemTags };
