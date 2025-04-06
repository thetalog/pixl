const express = require("express");
const router = express.Router();
const sendDirectMessage = require("./sendDirectMessage.js");
const seenDirectMessage = require("./seenDirectMessage.js");
const retractDirectMessage = require("./retractDirectMessage.js");
const reactDirectMessage = require("./reactDirectMessage.js");

router.use(
  "/message",
  sendDirectMessage,
  seenDirectMessage,
  retractDirectMessage,
  reactDirectMessage
);

module.exports = router;
