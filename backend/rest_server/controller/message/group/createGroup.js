const { createGroup } = require("../../../database/message/group/createGroup");

const {
  uploadGroupDPMediaToMinIO,
} = require("../../storage/uploadToMinIO");

const generateGroupIds = require("../../../utils/generateId");

exports.createGroupController = async (req, res) => {
  try {
    const user = req.user;
    const file = req.file;

    const body = JSON.parse(req.body.postData || "{}");
    const { groupName, addedUsernames } = body;

    /* ================= VALIDATION ================= */

    if (!groupName) {
      return res.status(400).json({
        message: "groupName is required",
      });
    }

    if (!file) {
      return res.status(400).json({
        message: "groupDisplayPicture is required",
      });
    }

    if (!addedUsernames) {
      return res.status(400).json({
        message: "addedUsernames is required",
      });
    }

    /* ================= UPLOAD GROUP DP ================= */

    const groupId = generateGroupIds();

    const uploadResults = await uploadGroupDPMediaToMinIO(
      groupId,
      file
    );

    if (!uploadResults || uploadResults.length === 0) {
      return res.status(500).json({
        message: "No files uploaded.",
      });
    }

    /* ================= DATABASE ================= */

    const response = await createGroup(
      user,
      groupName,
      addedUsernames,
      groupId,
      uploadResults
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Group creation failed.",
      });
    }

    /* ================= SUCCESS ================= */

    return res.status(200).json({
      message: "Group created successfully.",
      groupId,
    });

  } catch (error) {
    console.error("Create group controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
