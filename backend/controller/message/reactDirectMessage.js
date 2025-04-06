const {
  dbReactDirectMessage,
} = require("../../database/query/message/directMessage/reactDirectMessage.js");

async function reactDirectMessage(user, messageId, senderUsername, emoji) {
  try {
    const response = await dbReactDirectMessage(
      user,
      messageId,
      senderUsername,
      emoji
    );
    if (response.status === 500) {
      return { message: "React Direct Message failed.", status: 500 };
    }
    if (response.status === 404) {
      return { message: response.message, status: 404 };
    }
    if (response.status === 400) {
      return { message: response.message, status: 400 };
    }
    return {
      message: "React Direct Message successfully.",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong." };
  }
}

module.exports = { reactDirectMessage };
