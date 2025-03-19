const {
  getUserByCreds,
} = require("../database/query/user/authentication/user");
const { createLogin } = require("../database/query/user/authentication/login");
const crypto = require("crypto");
const { signJWT } = require("./jwt");

async function loginController(body) {
  try {
    const hashedPassword = crypto
      .createHash("sha3-512")
      .update(body?.password)
      .digest("hex");
    const dbResponse = await getUserByCreds(body?.email, hashedPassword);
    let response = {};
    if (!dbResponse) {
      response["status"] = 400;
      response["message"] = "Something went wrong!";
    } else if (dbResponse?.status === 404) {
      response["status"] = dbResponse?.status;
      response["message"] = dbResponse?.message;
    } else {
      const jwtResponse = await signJWT(body?.email, dbResponse?.name);
      if (jwtResponse.status === 201) {
        response["status"] = 200;
        response["message"] = "Login successful!";
        response["data"] = jwtResponse.data;
      } else {
        response["status"] = 500;
        response["message"] = "Failed to create JWT!";
      }
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
