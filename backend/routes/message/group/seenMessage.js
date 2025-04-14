const express = require("express");
const {
  seenMessage,
} = require("../../../controller/message/group/seenMessage.js");

const router = express.Router();
router.patch("/seen-message", async (req, res) => {
  try {
    const groupId = req.body.groupId;
    if (!groupId) {
      return res.status(400).json({ message: "groupId is required" });
    }
    const seenMessageResponse = await seenMessage(req.user, groupId);
    if (seenMessageResponse.status === 500) {
      return res.status(500).json({ message: seenMessageResponse.message });
    }
    if (seenMessageResponse.status !== 200) {
      return res.status(400).json({ message: seenMessageResponse.message });
    }
    res.status(200).json(seenMessageResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
