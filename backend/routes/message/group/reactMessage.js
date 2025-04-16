const express = require("express");
const {
  reactMessage,
} = require("../../../controller/message/group/reactMessage.js");

const router = express.Router();
router.put("/react-message", async (req, res) => {
  try {
    const groupId = req.body.groupId;
    if (!groupId) {
      return res.status(400).json({ message: "groupId is required" });
    }
    const messageId = req.body.messageId;
    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }
    const emoji = req.body.emoji;
    if (!emoji) {
      return res.status(400).json({ message: "emoji is required" });
    }
    const reactGroupMessageResponse = await reactMessage(
      req.user,
      groupId,
      messageId,
      emoji
    );
    if (reactGroupMessageResponse.status === 500) {
      return res
        .status(500)
        .json({ message: reactGroupMessageResponse.message });
    }
    if (reactGroupMessageResponse.status !== 200) {
      return res
        .status(400)
        .json({ message: reactGroupMessageResponse.message });
    }
    res.status(200).json(reactGroupMessageResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
