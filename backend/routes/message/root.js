const express = require("express");
const router = express.Router();
const sendDirectMessage = require("./direct/sendMessage.js");
const seenDirectMessage = require("./direct/seenMessage.js");
const retractDirectMessage = require("./direct/retractMessage.js");
const reactDirectMessage = require("./direct/reactMessage.js");

const createGroup = require("./group/createGroup.js");
const sendGroupMessage = require("./group/sendMessage.js");
// const seenGroupMessage = require("./groupMessage/seenMessage.js");
// const retractGroupMessage = require("./groupMessage/retractMessage.js");
// const reactGroupMessage = require("./groupMessage/reactMessage.js");

const directMessage = router.use(
  "/direct",
  sendDirectMessage,
  seenDirectMessage,
  retractDirectMessage,
  reactDirectMessage
);

const groupMessage = router.use("/group", createGroup, sendGroupMessage);

router.use("/message", directMessage, groupMessage);

module.exports = router;
