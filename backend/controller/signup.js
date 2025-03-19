const { signup } = require("../database/query/user/authentication/signup");
const crypto = require("crypto");
const { signJWT } = require("./jwt");

async function signupController(body) {
  const hashedPassword = crypto
    .createHash("sha3-512")
    .update(body?.password)
    .digest("hex");

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
