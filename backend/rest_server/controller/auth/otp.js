const { sendOTPSchema, verifyOTPSchema } = require("./validator");

exports.sendOtpController = async (req, res) => {
    try {
        const { error } = sendOTPSchema.validate(req.body);

        if (error)
            return res.status(400).json({ message: "Validation failed!" });

        const response = await sendOTP({ ...req.body });

        return res.status(response ? 200 : 400).json({
            message: response ? "OTP send successful" : "OTP failed to send.",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "OTP failed during sending",
        });
    }
};

exports.verifyOtpController = async (req, res) => {
    try {
        const { error } = verifyOTPSchema.validate(req.body);

        if (error)
            return res.status(400).json({ message: "Validation failed!" });

        const response = await verifyOTP({ ...req.body });

        return res.status(response.status).json({
            message: response.message,
            data: response?.data,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "OTP failed during verification",
        });
    }
};
