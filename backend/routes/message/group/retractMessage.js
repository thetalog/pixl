const express = require("express");
const {
  retractMessage,
} = require("../../../controller/message/group/retractMessage.js");

const router = express.Router();
router.delete("/retract-message", async (req, res) => {
  try {
    const groupId = req.body.groupId;
    if (!groupId) {
      return res.status(400).json({ message: "groupId is required" });
    }
    const messageId = req.body.messageId;
    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }
    const retractGroupMessageResponse = await retractMessage(
      req.user,
      groupId,
      messageId,
    );
    if (retractGroupMessageResponse.status === 500) {
      return res
        .status(500)
        .json({ message: retractGroupMessageResponse.message });
    }
    if (retractGroupMessageResponse.status !== 200) {
      return res
        .status(400)
        .json({ message: retractGroupMessageResponse.message });
    }
    res.status(200).json(retractGroupMessageResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
