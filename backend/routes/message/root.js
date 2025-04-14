const express = require("express");
const router = express.Router();
const sendDirectMessage = require("./directMessage/sendMessage.js");
const seenDirectMessage = require("./directMessage/seenMessage.js");
const retractDirectMessage = require("./directMessage/retractMessage.js");
const reactDirectMessage = require("./directMessage/reactMessage.js");

const createGroup = require("./groupMessage/createGroup.js");
// const sendGroupMessage = require("./groupMessage/sendMessage.js");
// const seenGroupMessage = require("./groupMessage/seenMessage.js");
// const retractGroupMessage = require("./groupMessage/retractMessage.js");
// const reactGroupMessage = require("./groupMessage/reactMessage.js");


const directMessage = router.use("/direct", sendDirectMessage,
  seenDirectMessage,
  retractDirectMessage,
  reactDirectMessage)

const groupMessage = router.use("/group", createGroup,)
  
router.use(
  "/message",
  directMessage,
  groupMessage
);

module.exports = router;
