const express = require("express");
const router = express.Router();

const requestFollow = require("./request.js");
// const acceptFollow = require("./accept.js");
// const rejectFollow = require("./reject.js");

router.use("/follow", requestFollow);

module.exports = router;