const {
  dbFollowRequest,
} = require("../../database/query/follow/followRequest.js");

async function requestFollow(user, targetUsername) {
  try {
    const response = await dbFollowRequest(user, targetUsername);
    if (response.status === 500) {
      return { message: "Follow Request failed.", status: 500 };
    }
    return {
      message: "Follow Request successfully.",
      status: 201,
    };
  } catch (error) {
    return { message: "Something went wrong." };
  }
}

module.exports = { requestFollow };
