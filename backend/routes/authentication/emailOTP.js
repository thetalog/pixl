const express = require("express");
const router = express.Router();
const { sendOTP } = require("../../controller/emailOTP");
const { sendOTPSchema } = require("./validator");
router.post("/send-otp", async (req, res) => {
  try {
    if (sendOTPSchema.validate(req.body).error?.details.length > 0)
      return res.status(400).json({ message: "Validation failed!" });
    const response = await sendOTP({ ...req.body });
    return res.status(response ? 200 : 400).json({
      message: response ? "OTP send successful" : "OTP failed to send.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "OTP failed during sending",
    });
  }
});

module.exports = router;
