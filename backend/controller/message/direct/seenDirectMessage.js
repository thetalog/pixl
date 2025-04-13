const { dbSeenDirectMessage } = require("../../../database/query/message/direct/seenDirectMessage.js");
  
async function seenDirectMessage(
  user,
  senderUsername,
) {
  try {
    const response = await dbSeenDirectMessage(
      user,
      senderUsername
    );
    if (response.status === 500) {
      return { message: "Seen Direct Message failed.", status: 500 };
    }
    if (response.status === 404) {
      return { message: response.message, status: 404 };
    }
    if (response.status === 400) {
      return { message: response.message, status: 400 };
    }
    return {
      message: "Seen Direct Message successfully.",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong." };
  }
}

module.exports = { seenDirectMessage };
