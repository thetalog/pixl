const { dbCreateReel } = require("../../database/query/posts/createReel.js");
const { uploadFilesToMinIO } = require("../object_storage/uploadFilesToMinIO");
async function createReel(
  userId,
  postsCount,
  musicCredit,
  tags,
  caption,
  taggedUsers,
  file
) {
  try {
    const uploadResults = await uploadFilesToMinIO(userId, postsCount, file);
    if (uploadResults?.length === 0) {
      return { message: "No files uploaded.", status: 500 };
    }
    const response = await dbCreateReel(
      userId,
      musicCredit,
      tags,
      caption,
      taggedUsers,
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

module.exports = { createReel };
