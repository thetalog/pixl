const {
  getUserByCreds,
} = require("../database/query/user/authentication/user");
const { createLogin } = require("../database/query/user/authentication/login");
const fs = require("fs");
const crypto = require("crypto");
const { signJWT } = require("./jwt");

async function loginController(body) {
  try {
    const privateKey = fs.readFileSync("./routes/authentication/pixl", "utf8");
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha512",
      },
      Buffer.from(body?.password, "base64")
    );
    const hashedPassword = crypto.hash("SHA3-512", decryptedData);
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
    await createLogin(
      body?.email,
      dbResponse?.id,
      hashedPassword,
      response["status"] === 200 ? true : false,
      body?.IPAddress,
      response?.message
    );
    const jwtResponse = await signJWT(dbResponse?.email, dbResponse?.name);
    if (jwtResponse?.status !== 201)
      return {
        status: 500,
        message: "Something went wrong",
      };
    return {
      status: response.status,
      message: response.message,
      data:
        response.status !== 404
          ? { ...response?.data, token: jwtResponse?.data }
          : response?.data,
    };
  } catch (error) {
    return {
      status: 500,
      message: "Something went wrong!",
    };
  }
}

module.exports = { loginController };
