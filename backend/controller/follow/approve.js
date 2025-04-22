const {
  dbApproveFollow,
} = require("../../database/query/follow/approve.js");

async function approveFollow(user, requestId, requesterUsername) {
  try {
    const response = await dbApproveFollow(user, requestId, requesterUsername);
    if (response.status === 500) {
      return { message: "Follow Approved failed.", status: 500 };
    }
    return {
      message: "Follow Approved successfully.",
      status: 201,
    };
  } catch (error) {
    return { message: "Something went wrong." };
  }
}

module.exports = { approveFollow };
