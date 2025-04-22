const {
  dbFollowReject,
} = require("../../database/query/follow/reject.js");

async function rejectFollow(user, requestId, requesterUsername) {
  try {
    const response = await dbFollowReject(user, requestId, requesterUsername);
    if (response.status === 500) {
      return { message: "Follow Reject failed.", status: 500 };
    }
    return {
      message: "Follow Reject successfully.",
      status: 201,
    };
  } catch (error) {
    return { message: "Something went wrong." };
  }
}

module.exports = { rejectFollow };
