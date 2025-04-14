const {
  dbSendMessage,
} = require("../../../database/query/message/direct/sendMessage");
const {
  uploadDirectMediaToMinIO,
} = require("../../object_storage/uploadFilesToMinIO");
async function sendMessage(user, receiverUsername, message, media) {
  try {
    const uploadResults =
      media?.length !== 0 && (await uploadDirectMediaToMinIO(user?.id, media));
    if (media?.length !== 0 && uploadResults?.length === 0) {
      return { message: "No files uploaded.", status: 500 };
    }
    const response = await dbSendMessage(
      user,
      receiverUsername,
      message,
      uploadResults
    );
    if (response.status === 500) {
      return { message: "Direct Message failed.", status: 500 };
    }
    return {
      message: "Direct Message successfully.",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong." };
  }
}

module.exports = { sendMessage };
