const express = require("express");
const router = express.Router();
const { sendOTP, verifyOTP } = require("../../controller/emailOTP");
const { sendOTPSchema, verifyOTPSchema } = require("./validator");
router.post(
  "/send-otp",
  (req, send, next) => {
    if (sendOTPSchema.validate(req.body).error?.details.length > 0)
      return res.status(400).json({ message: "Validation failed!" });
    next();
  },
  async (req, res) => {
    try {
      const response = await sendOTP({ ...req.body });
      return res.status(response ? 200 : 400).json({
        message: response ? "OTP send successful" : "OTP failed to send.",
      });
    } catch (error) {
      return res.status(500).json({
        message: "OTP failed during sending",
      });
    }
  }
);
router.post(
  "/verify-otp",
  (req, res, next) => {
    if (verifyOTPSchema.validate(req.body).error?.details.length > 0)
      return res.status(400).json({ message: "Validation failed!" });
    next();
  },
  async (req, res) => {
    try {
      const response = await verifyOTP({ ...req.body });
      return res.status(response.status).json({
        message: response.message,
      });
    } catch (error) {
      return res.status(500).json({
        message: "OTP failed during verification",
      });
    }
  }
);

module.exports = router;
