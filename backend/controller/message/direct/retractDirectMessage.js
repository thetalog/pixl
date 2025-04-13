const {
  dbRetractDirectMessage,
} = require("../../../database/query/message/direct/retractDirectMessage.js");

async function retractDirectMessage(user, messageId, senderUsername) {
  try {
    const response = await dbRetractDirectMessage(
      user,
      messageId,
      senderUsername
    );
    if (response.status === 500) {
      return { message: "Retract Direct Message failed.", status: 500 };
    }
    if (response.status === 404) {
      return { message: response.message, status: 404 };
    }
    if (response.status === 400) {
      return { message: response.message, status: 400 };
    }
    return {
      message: "Retract Direct Message successfully.",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong." };
  }
}

module.exports = { retractDirectMessage };
