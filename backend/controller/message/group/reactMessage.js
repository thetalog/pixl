const {
    dbReactMessage,
  } = require("../../../database/query/message/group/reactMessage.js");
  
  async function reactDirectMessage(user,
    groupId,
    messageId,
    emoji) {
    try {
      const response = await dbReactMessage(
        user,
        groupId,
        messageId,
        emoji
      );
      if (response.status === 500) {
        return { message: "React group Message failed.", status: 500 };
      }
      if (response.status === 404) {
        return { message: response.message, status: 404 };
      }
      if (response.status === 400) {
        return { message: response.message, status: 400 };
      }
      return {
        message: "React group Message successfully.",
        status: 201,
      };
    } catch (error) {
      console.log(error);
      return { message: "Something went wrong." };
    }
  }
  
  module.exports = { reactDirectMessage };
  