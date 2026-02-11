const { dbReactStory } = require("../../database/query/stories/reactStory.js");

async function reactStory(user, storyID) {
  try {
    const response = await dbReactStory(user, storyID);
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
