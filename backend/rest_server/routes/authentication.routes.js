const express = require("express");
const router = express.Router();

const { sendOtpController, verifyOtpController } = require("../controller/auth/otp.js");
const { loginController } = require("../controller/auth/login.js");
const { signupController } = require("../controller/auth/signup.js");

router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.post("/auth/login", loginController);
router.post("/auth/signup", signupController);

module.exports = router;