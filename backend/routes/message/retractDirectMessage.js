const express = require("express");
const {
  retractDirectMessage,
} = require("../../controller/message/retractDirectMessage.js");

const router = express.Router();
router.delete("/retract-direct-message", async (req, res) => {
  try {
    const senderUsername = req.body.senderUsername;
    if (!senderUsername) {
      return res.status(400).json({ message: "senderUsername is required" });
    }
    const messageId = req.body.messageId;
    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }
    const retractDirectMessageResponse = await retractDirectMessage(
      req.user,
      messageId,
      senderUsername
    );
    if (retractDirectMessageResponse.status === 500) {
      return res
        .status(500)
        .json({ message: retractDirectMessageResponse.message });
    }
    if (retractDirectMessageResponse.status !== 200) {
      return res
        .status(400)
        .json({ message: retractDirectMessageResponse.message });
    }
    res.status(200).json(seenDirectMessageResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
