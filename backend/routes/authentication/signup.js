const express = require("express");
const router = express.Router();
const { signupSchema } = require("./validator");
const { signup } = require("../../database/query/user/authentication/signup");
const fs = require("fs");
const crypto = require("crypto");

router.post("/signup", async (req, res) => {
  const isValidate = signupSchema.validate(req.body);
  if (isValidate?.error) {
    res.status(400).json({ message: "Validation Error" });
  } else {
    // const publicKey = fs.readFileSync(
    //   "./routes/authentication/pixl.pem",
    //   "utf8"
    // );
    const privateKey = fs.readFileSync("./routes/authentication/pixl", "utf8");

    // const encryptedData = crypto.publicEncrypt(
    //   {
    //     key: publicKey,
    //     padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    //     oaepHash: "sha512",
    //   },
    //   Buffer.from(req.body?.password) // Convert message to a Buffer
    // );
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha512",
      },
      Buffer.from(req.body?.password, "base64")
    );
    const hashedPassword = crypto.hash("SHA3-512", decryptedData);
    const response = await signup({
      ...req?.body,
      isEmailVerified: false,
      password: hashedPassword,
    });
    res.status(response.status).json({
      message: response.message,
      data: response?.data,
    });
  }
});

module.exports = router;
