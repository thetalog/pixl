const { addStoryReaction } = require("../../database/story/react.js");

async function reactStory(user, storyID) {
  try {
    const response = await addStoryReaction(user, storyID);
    if (response.status === 500) {
      return { message: "Story react failed.", status: 500 };
    }
    return {
      message: "Story Reacted.",
      status: 201,
    };
  } catch (error) {
    return { message: "Something went wrong." };
  }
}

module.exports = { reactStory };
