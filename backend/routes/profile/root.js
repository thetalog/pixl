const express = require("express");
const router = express.Router();
const updateProfile = require("./updateProfile");

router.use("/profile", updateProfile);

module.exports = router;
