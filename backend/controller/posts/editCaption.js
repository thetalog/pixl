const { dbEditCaption } = require("../../database/query/posts/editCaption.js");
const { dbGetPostBy } = require("../../database/query/posts/getPostBy");
async function editCaption(userId, postId, newCaption) {
  try {
    const fetchedPost = await dbGetPostBy("postId", postId);
    if (fetchedPost.status === 500) {
      return { message: "Post not found.", status: 404 };
    }
    if (fetchedPost?.data) {
      const response = await dbEditCaption(postId, newCaption);
      if (response.status === 500) {
        return { message: "Post caption update failed.", status: 500 };
      } else {
        return {
          message: "Post caption update successfully.",
          status: 201,
        };
      }
    }
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong." };
  }
}

module.exports = { editCaption };
