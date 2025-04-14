const express = require("express");
const {
  sendMessage,
} = require("../../../controller/message/group/sendMessage.js");

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
    const sendGroupMessageResponse = await sendMessage(
      req.user,
      body?.groupId,
      body?.message,
      req?.files
    );
    if (sendGroupMessageResponse.status === 500) {
      return res
        .status(500)
        .json({ message: sendGroupMessageResponse.message });
    }
    if (sendGroupMessageResponse.status !== 200) {
      return res
        .status(400)
        .json({ message: sendGroupMessageResponse.message });
    }
    res.status(200).json(sendGroupMessageResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
