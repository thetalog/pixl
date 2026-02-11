const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const updatePostByOwner = async ({ postId, userId, data = {} }) => {
    const post = await prisma.post.findFirst({
        where: { id: postId, userId, postDisabled: false },
    });

    if (!post) return null;

    const updateData = {};

    if ("caption" in data) updateData.caption = data.caption;
    if ("location" in data) updateData.location = data.location;
    if ("userTags" in data) updateData.userTags = data.userTags;
    if ("taggedUsers" in data) updateData.taggedUsers = data.taggedUsers;

    if (!Object.keys(updateData).length) return post;

    return prisma.post.update({
        where: { id: postId },
        data: updateData,
    });
};

module.exports = { updatePostByOwner };