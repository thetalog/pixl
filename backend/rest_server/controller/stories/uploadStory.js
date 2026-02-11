const {
  dbUploadStory,
} = require("../../database/query/stories/uploadStory.js");

async function uploadStory(user, mediaURL, mentionIDs) {
  try {
    const response = await dbUploadStory(user, mediaURL, mentionIDs);
    if (response.status === 500) {
      return { message: "Upload Story failed.", status: 500 };
    }
    return {
      message: "Story posted.",
      status: 201,
    };
  } catch (error) {
    return { message: "Something went wrong." };
  }
}

module.exports = { uploadStory };
