const express = require("express");
const router = express.Router();

const { sendOtpController, verifyOtpController } = require("../controller/authentication/otp.js");
const { loginController } = require("../controller/authentication/login.js");
const { signupController } = require("../controller/authentication/signup.js");

router.use("/send-otp", sendOtpController);
router.use("/verify-otp", verifyOtpController);
router.use("/login", loginController);
router.use("/signup", signupController);

module.exports = router;