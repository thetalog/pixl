const express = require("express");
const router = express.Router();
const sendDirectMessage = require("./directMessage/sendMessage.js");
const seenDirectMessage = require("./directMessage/seenMessage.js");
const retractDirectMessage = require("./directMessage/retractMessage.js");
const reactDirectMessage = require("./directMessage/reactMessage.js");

// const sendGroupMessage = require("./groupMessage/sendMessage.js");
// const seenGroupMessage = require("./groupMessage/seenMessage.js");
// const retractGroupMessage = require("./groupMessage/retractMessage.js");
// const reactGroupMessage = require("./groupMessage/reactMessage.js");


const directMessage = router.use("/direct", sendDirectMessage,
  seenDirectMessage,
  retractDirectMessage,
  reactDirectMessage)

router.use(
  "/message",
  directMessage
);

module.exports = router;
