const { signup } = require("../database/query/user/authentication/signup");
const fs = require("fs");
const crypto = require("crypto");
const { signJWT } = require("./jwt");

async function signupController(body) {
  // const publicKey = fs.readFileSync(
  //   "./routes/authentication/pixl.pem",
  //   "utf8"
  // );
  const privateKey = fs.readFileSync("./routes/authentication/pixl.pem", "utf8");

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
      passphrase: "1111",
      padding: crypto.constants.RSA_NO_PADDING,
      oaepHash: "sha512",
    },
    Buffer.from(body?.password, "base64")
  );
  const hashedPassword = crypto.hash("SHA3-512", decryptedData);
  const response = await signup({
    ...body,
    isEmailVerified: false,
    password: hashedPassword,
  });
  return {
    status: response.status,
    message: response.message,
    data: { ...response?.data },
  };
}

module.exports = { signupController };
