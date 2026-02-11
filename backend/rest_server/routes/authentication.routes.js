const express = require("express");
const router = express.Router();

const { sendOtpController, verifyOtpController } = require("../controller/auth/otp.js");
const { loginController } = require("../controller/auth/login.js");
const { signupController } = require("../controller/auth/signup.js");

router.use("/send-otp", sendOtpController);
router.use("/verify-otp", verifyOtpController);
router.use("/login", loginController);
router.use("/signup", signupController);

module.exports = router;