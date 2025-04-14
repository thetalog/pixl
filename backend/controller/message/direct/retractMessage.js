const {
  dbRetractMessage,
} = require("../../../database/query/message/direct/retractMessage.js");

async function retractMessage(user, messageId, senderUsername) {
  try {
    const response = await dbRetractMessage(user, messageId, senderUsername);
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

module.exports = { retractMessage };
