const express = require("express");
const {
  createGroup,
} = require("../../../controller/message/group/createGroup.js");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });
const router = express.Router();
router.post("/create-group", upload.single("file"), async (req, res) => {
  try {
    const groupName = JSON.parse(req.body?.postData).groupName;
    const addedUsernames = JSON.parse(req.body?.postData).addedUsernames;
    if (!groupName) {
      return res.status(400).json({ message: "groupName is required" });
    }
    if (!req?.file) {
      return res
        .status(400)
        .json({ message: "groupDisplayPicture is required" });
    }
    if (!addedUsernames) {
      return res.status(400).json({ message: "addedUsernames is required" });
    }
    const createGroupResponse = await createGroup(
      req.user,
      groupName,
      req.file,
      addedUsernames
    );
    if (createGroupResponse.status === 500) {
      return res.status(500).json({ message: createGroupResponse.message });
    }
    if (createGroupResponse.status !== 200) {
      return res.status(400).json({ message: createGroupResponse.message });
    }
    res.status(200).json(createGroupResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
