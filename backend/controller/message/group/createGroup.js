const {
  dbCreateGroup,
} = require("../../../database/query/message/group/createGroup.js");
const {
  uploadGroupDPMediaToMinIO,
} = require("../../object_storage/uploadFilesToMinIO");
const generateGroupIds = require("./generateGroupId.js");
async function createGroup(
  user,
  groupName,
  groupDisplayPicture,
  addedUsernames
) {
  try {
    const groupId = generateGroupIds();
    const uploadResults = await uploadGroupDPMediaToMinIO(
      groupId,
      groupDisplayPicture
    );
    if (uploadResults?.length === 0) {
      return { message: "No files uploaded.", status: 500 };
    }
    const response = await dbCreateGroup(
      user,
      groupName,
      addedUsernames,
      groupId,
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

module.exports = { createGroup };
