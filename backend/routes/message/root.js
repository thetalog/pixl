const express = require("express");
const router = express.Router();
const sendDirectMessage = require("./sendDirectMessage.js");

router.use("/message", sendDirectMessage, );

module.exports = router;
