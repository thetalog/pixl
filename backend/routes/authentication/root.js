const express = require("express");
const router = express.Router();
const signup = require("./signup");
const login = require("./login");
const emailOTP = require("./emailOTP");

router.use("/auth", emailOTP, signup, login);

module.exports = router;
