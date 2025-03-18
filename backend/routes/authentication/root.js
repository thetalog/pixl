const express = require("express");
const router = express.Router();
const signup = require("./signup");
const login = require("./login");
const emailOTP = require("./emailOTP");
const checkUsernameExist = require("./checkUsernameExist");

router.use("/auth", emailOTP, signup, login, checkUsernameExist);

module.exports = router;
