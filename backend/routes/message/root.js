const express = require("express");
const router = express.Router();
const sendDirectMessage = require("./sendDirectMessage.js");
const seenDirectMessage = require("./seenDirectMessage.js");

router.use("/message", sendDirectMessage,seenDirectMessage );

module.exports = router;
