const express = require("express");
const {
  createGroup,
} = require("../../../controller/message/group/createGroup.js");

const router = express.Router();
router.put("/create-group", async (req, res) => {
  try {
      const groupName = req.body.groupName;
      const groupDisplayPicture = req.body.groupDisplayPicture;
    const addedUsernames = req.body.addedUsernames;
    if (!groupName) {
      return res.status(400).json({ message: "groupName is required" });
    }
    if (!groupDisplayPicture) {
      return res.status(400).json({ message: "groupDisplayPicture is required" });
    }
    if (!addedUsernames) {
      return res.status(400).json({ message: "addedUsernames is required" });
    }
    const reactDirectMessageResponse = await reactDirectMessage(
      req.user,
      groupName,
      groupDisplayPicture,
      addedUsernames
    );
    if (reactDirectMessageResponse.status === 500) {
      return res
        .status(500)
        .json({ message: reactDirectMessageResponse.message });
    }
    if (reactDirectMessageResponse.status !== 200) {
      return res
        .status(400)
        .json({ message: reactDirectMessageResponse.message });
    }
    res.status(200).json(reactDirectMessageResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
