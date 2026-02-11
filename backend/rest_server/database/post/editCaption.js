const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbEditCaption(postId, newCaption) {
  try {
    const updatePost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        caption: newCaption,
      },
    });
    return {
      message: "Post caption update successfully.",
      status: 201,
      data: updatePost,
    };
  } catch (error) {
    return { message: "Post caption update failed.", status: 500 };
  }
  await prisma.$disconnect();
  return response;
}

module.exports = { dbEditCaption };
