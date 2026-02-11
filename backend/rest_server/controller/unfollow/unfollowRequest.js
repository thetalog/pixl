const { dbUnfollowRequest } = require("../../database/query/unfollow/request.js");
const {
  dbFollowPublicAccount,
} = require("../../database/query/follow/publicAccountFollow.js");

async function unfollowRequest(user, targetUsername) {
  try {
    const targetHasPrivateAccount = await dbCheckAccountPrivacyStatus(
      targetUsername
    );
    if (targetHasPrivateAccount) {
      const response = await dbUnfollowRequest(user, targetUsername);
      if (response.status === 500) {
        return { message: "Unfollow Request failed.", status: 500 };
      }
      return {
        message: "Unfollowed successful.",
        status: 201,
      };
    } else {
      const response = await dbFollowPublicAccount(user, targetUsername);
      if (response.status === 500) {
        return { message: "Unfollow failed.", status: 500 };
      }
      return {
        message: "Unfollowed successful.",
        status: 201,
      };
    }
  } catch (error) {
    return { message: "Something went wrong." };
  }
}

module.exports = { unfollowRequest };
