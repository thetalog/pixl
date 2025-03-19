const express = require("express");
const router = express.Router();
const queryLocation = require("./queryLocation.js");

router.use("/external", queryLocation);

module.exports = router;
