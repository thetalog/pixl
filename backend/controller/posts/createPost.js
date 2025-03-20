const { dbCreatePost } = require("../../database/query/posts/createPost");
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
    if (uploadResults?.length === 0) {
      return { message: "No files uploaded.", status: 500 };
    }
    const response = await dbCreatePost(
      userId,
      taggedUsers,
      location,
      caption,
      uploadResults
    );
    if (response.status === 500) {
      return { message: "Post failed.", status: 500 };
    }
    return {
      message: "Post created successfully.",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong." };
  }
}

module.exports = { createPost };
