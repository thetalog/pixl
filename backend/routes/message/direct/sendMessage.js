const express = require("express");
const {
  sendMessage,
} = require("../../../controller/message/direct/sendMessage");

const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: "uploads/" });
router.post("/send-message", upload.array("files"), async (req, res) => {
  try {
    const body = JSON.parse(req.body.postData);
    if (!body) {
      return res.status(400).json({ message: "Body is required" });
    }
    if (!body?.receiverUsername) {
      return res.status(400).json({ message: "Receiver Username is required" });
    }
    if (!body?.message) {
      return res.status(400).json({ message: "Message is required" });
    }
    const sendMessageResponse = await sendMessage(
      req.user,
      body?.receiverUsername,
      body?.message,
      req?.files
    );
    if (sendMessageResponse.status === 500) {
      return res.status(500).json({ message: sendMessageResponse.message });
    }
    if (sendMessageResponse.status !== 200) {
      return res.status(400).json({ message: sendMessageResponse.message });
    }
    res.status(200).json(sendMessageResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
