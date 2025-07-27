const express = require("express");
const router = express.Router();

const unfollowRequest = require("./unfollowRequest.js");

router.use("/unfollow", unfollowRequest);

module.exports = router;