const {
  dbDeleteStory,
} = require("../../database/query/stories/deleteStory.js");

async function deleteStory(user, storyID) {
  try {
    const response = await dbDeleteStory(user, storyID);
    if (response.status === 500) {
      return { message: "Story deletion failed.", status: 500 };
    }
    return {
      message: "Story Deleted.",
      status: 201,
    };
  } catch (error) {
    return { message: "Something went wrong." };
  }
}

module.exports = { deleteStory };
