const { dbCreateGroup } = require("../../../database/query/message/group/createGroup.js");
const { uploadDirectMediaToMinIO } = require("../../object_storage/uploadFilesToMinIO");   

async function sendDirectMessage(
  user,
  receiverUsername,
    message,
    media
) {
  try {
    const uploadResults = media?.length !== 0 && await uploadDirectMediaToMinIO(user?.id, media);
    if (media?.length !== 0 && uploadResults?.length === 0) {
      return { message: "No files uploaded.", status: 500 };
    }
    const response = await dbCreateGroup(
      user,
      groupName,
      groupDisplayPicture,
      addedUsernames,
      uploadResults
    );
    if (response.status === 500) {
      return { message: "Group creation failed.", status: 500 };
    }
    return {
      message: "Group created successfully.",
      status: 201,
    };
  } catch (error) {
    console.log(error);
    return { message: "Something went wrong." };
  }
}

module.exports = { sendDirectMessage };
