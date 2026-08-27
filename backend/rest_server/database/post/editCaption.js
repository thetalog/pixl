const prisma = require("../../lib/prisma");

async function updatePostCaption(postId, newCaption) {
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
  }  return response;
}

module.exports = { updatePostCaption };
