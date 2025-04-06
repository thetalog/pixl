const express = require("express");
const {
  reactDirectMessage,
} = require("../../controller/message/reactDirectMessage.js");

const router = express.Router();
router.put("/react-direct-message", async (req, res) => {
  try {
    const senderUsername = req.body.senderUsername;
    if (!senderUsername) {
      return res.status(400).json({ message: "senderUsername is required" });
    }
    const messageId = req.body.messageId;
    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }
    const emoji = req.body.emoji;
    if (!emoji) {
      return res.status(400).json({ message: "emoji is required" });
    }
    const reactDirectMessageResponse = await reactDirectMessage(
      req.user,
      messageId,
      senderUsername,
      emoji
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
