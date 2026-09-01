const jwt = require("jsonwebtoken");

async function signJWT(email, name, userName, extra = {}) {
  try {
    const secretKey = process.env.JWT_SECRET_KEY;
    const payload = {
      email,
      name,
      userName,
      sid: Number(extra.sid || 0),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    };
    if (extra.impersonatorId) payload.impersonatorId = extra.impersonatorId;
    if (extra.impersonationId) payload.impersonationId = extra.impersonationId;
    const token = jwt.sign(payload, secretKey, { algorithm: "HS256" });
    return { status: 201, message: "JWT Created!", data: token };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Something went wrong!" };
  }
}

module.exports = { signJWT };
