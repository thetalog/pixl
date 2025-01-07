const {
  getUserByCreds,
} = require("../database/query/user/authentication/user");
const { createLogin } = require("../database/query/user/authentication/login");
const fs = require("fs");
const crypto = require("crypto");
const { signJWT } = require("./jwt");

async function loginController(body) {
  try {
    const privateKey = fs.readFileSync("./routes/authentication/pixl.pem", "utf8");
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey,
        passphrase: "1111",
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(body?.password, "base64")
    );
    const hashedPassword = crypto.createHash("sha3-512").update(decryptedData).digest("hex");
    const dbResponse = await getUserByCreds(body?.email, hashedPassword);
    let response = {};
    if (!dbResponse) {
      response["status"] = 400;
      response["message"] = "Something went wrong!";
    } else if (dbResponse?.status === 404) {
      response["status"] = dbResponse?.status;
      response["message"] = dbResponse?.message;
    } else {
      response["status"] = 200;
      response["message"] = "Login successful!";
    }
    return response;
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: "Internal server error",
    };
  }
}

module.exports = { loginController };
