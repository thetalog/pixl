const crypto = require("crypto");
const { createUserAccount } = require("../../database/auth/signup");
const { signupSchema } = require("./validator");
const { assertCanRegister } = require("../../lib/admin/restrictions");

exports.signupController = async (req, res) => {
  try {
    /* ================= VALIDATION ================= */

    const { error } = signupSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Validation Error",
      });
    }

    try {
      await assertCanRegister();
    } catch (flagError) {
      return res.status(flagError.status || 403).json({
        error: true,
        message: flagError.message,
        code: flagError.code,
      });
    }

    const {
      email,
      password,
      userName,
      name,
      dateOfBirth,
    } = req.body;

    /* ================= HASH PASSWORD ================= */

    const hashedPassword = crypto
      .createHash("sha3-512")
      .update(password)
      .digest("hex");

    /* ================= CALCULATE AGE ================= */

    const birthDate = new Date(dateOfBirth);

    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date of birth format",
      });
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    /* ================= DATABASE CALL ================= */

    const response = await createUserAccount({
      email,
      name,
      userName,
      password: hashedPassword,
      dateOfBirth: birthDate,
      age,
      isEmailVerified: false,
    });

    return res.status(response.status).json({
      message: response.message,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};
