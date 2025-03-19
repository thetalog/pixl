const jwt = require("jsonwebtoken");

async function signJWT(email, name) {
  try {
    const secretKey = process.env.JWT_SECRET_KEY;
    var token = jwt.sign(
      {
        email: email,
        name: name,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      },
      secretKey,
      {
        algorithm: "HS256",
      }
    );

    return { status: 201, message: "JWT Created!", data: token };
  } catch (error) {
    console.log(error);
    return { status: 500, message: "Something went wrong!" };
  }
}

module.exports = { signJWT };
