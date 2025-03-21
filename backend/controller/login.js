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
      await createLogin(
        body?.email,
        null,
        hashedPassword,
        false,
        body?.IPAddress,
        response["message"]
      );
    } else if (dbResponse?.status === 404) {
      response["status"] = dbResponse?.status;
      response["message"] = dbResponse?.message;
      await createLogin(
        body?.email,
        null,
        hashedPassword,
        false,
        body?.IPAddress,
        response["message"]
      );
    } else {
      const jwtResponse = await signJWT(body?.email, dbResponse?.name);
      if (jwtResponse.status === 201) {
        response["status"] = 200;
        response["message"] = "Login successful!";
        response["data"] = jwtResponse.data;
        await createLogin(
          body?.email,
          dbResponse?.id,
          hashedPassword,
          true,
          body?.IPAddress,
          response["message"]
        );
      } else {
        response["status"] = 500;
        response["message"] = "Failed to create JWT!";
        await createLogin(
          body?.email,
          dbResponse?.id,
          hashedPassword,
          true,
          body?.IPAddress,
          response["message"]
        );
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
