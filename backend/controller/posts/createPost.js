const { use } = require("../../routes/posts/createPost");
const { uploadFilesToMinIO } = require("../object_storage/uploadObject");
async function createPost(userId, postsCount, tag, location, caption, file) {
  try {
    const uploadResults = await uploadFilesToMinIO(userId, postsCount, file);
    return { message: "Post created successfully.", data: uploadResults };
  } catch (error) {
    return { message: "Something went wrong." };
  }
}

module.exports = { createPost };
