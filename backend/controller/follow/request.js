const { dbFollowRequest } = require("../../database/query/follow/request.js");
const {
  dbCheckAccountPrivacyStatus,
} = require("../../database/query/follow/checkAccountPrivacyStatus.js");
const {
  dbFollowPublicAccount,
} = require("../../database/query/follow/publicAccountFollow.js");
async function requestFollow(user, targetUsername) {
  try {
    const targetHasPrivateAccount = await dbCheckAccountPrivacyStatus(
      targetUsername
    );
    if (targetHasPrivateAccount) {
      const response = await dbFollowRequest(user, targetUsername);
      if (response.status === 500) {
        return { message: "Follow Request failed.", status: 500 };
      }
      return {
        message: "Follow Request successfully.",
        status: 201,
      };
    } else {
      const response = await dbFollowPublicAccount(user, targetUsername);
      if (response.status === 500) {
        return { message: "Followed failed.", status: 500 };
      }
      return {
        message: "Followed successfully.",
        status: 201,
      };
    }
  } catch (error) {
    return { message: "Something went wrong." };
  }
}

module.exports = { requestFollow };
