const express = require("express");
const {
  sendDirectMessage,
} = require("../../../controller/message/direct/sendDirectMessage");

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
    const sendDirectMessageResponse = await sendDirectMessage(
      req.user,
      body?.receiverUsername,
      body?.message,
      req?.files
    );
    if (sendDirectMessageResponse.status === 500) {
      return res
        .status(500)
        .json({ message: sendDirectMessageResponse.message });
    }
    if (sendDirectMessageResponse.status !== 200) {
      return res
        .status(400)
        .json({ message: sendDirectMessageResponse.message });
    }
    res.status(200).json(sendDirectMessageResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
