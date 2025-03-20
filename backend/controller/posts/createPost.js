const { db_createPost } = require("../../database/query/posts/createPost");
const { uploadFilesToMinIO } = require("../object_storage/uploadFilesToMinIO");
async function createPost(
  userId,
  postsCount,
  taggedUsers,
  location,
  caption,
  file
) {
  try {
    const uploadResults = await uploadFilesToMinIO(userId, postsCount, file);
    const response = await db_createPost(
      userId,
      taggedUsers,
      location,
      caption,
      uploadResults
    );
    return {
      message: "Post created successfully.",
      status: 201,
      data: response,
    };
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong." };
  }
}

module.exports = { createPost };
