const {
  dbSendMessage,
} = require("../../../database/query/message/group/sendMessage.js");
const {
  uploadGroupMediaToMinIO,
} = require("../../object_storage/uploadFilesToMinIO");
const generateConversationId = require("../../../utils/generateId.js");
async function sendMessage(user, groupId, message, media) {
  try {
    const conversationId = generateConversationId();
    const uploadResults =
      media?.length !== 0 &&
      (await uploadGroupMediaToMinIO(user?.id, conversationId, media));
    if (media?.length !== 0 && uploadResults?.length === 0) {
      return { message: "No files uploaded.", status: 500 };
    }
    const response = await dbSendMessage(
      user,
      groupId,
      conversationId,
      message,
      uploadResults
    );
    if (response.status === 500) {
      return { message: "Group Message send failed.", status: 500 };
    }
    return {
      message: "Group Message send successfully.",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong." };
  }
}

module.exports = { sendMessage };
