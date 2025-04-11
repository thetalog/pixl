const express = require("express");
const {seenDirectMessage} = require("../../../controller/message/seenDirectMessage.js");

const router = express.Router();
router.patch("/seen-direct-message", async (req, res) => {
  try {
    const senderUsername = req.body.senderUsername
    if (!senderUsername) {
      return res.status(400).json({ message: "senderUsername is required" });
    }
    const seenDirectMessageResponse = await seenDirectMessage(req.user, senderUsername);
    if (seenDirectMessageResponse.status === 500) {
      return res.status(500).json({ message: seenDirectMessageResponse.message });
    }
    if (seenDirectMessageResponse.status !== 200) {
      return res.status(400).json({ message: seenDirectMessageResponse.message });
    }
    res.status(200).json(seenDirectMessageResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
