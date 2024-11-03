var jwt = require("jsonwebtoken");
const fs = require("fs");

async function signJWT(email, name, expiry) {
  try {
    var privateKey = fs.readFileSync("./routes/authentication/pixl");
    var token = jwt.sign(
      {
        email: email,
        name: name,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      },
      privateKey,
      {
        algorithm: "RS256",
      }
    );

    return { status: 201, message: "JWT Created!", data: token };
  } catch (error) {
    return { status: 500, message: "Something went wrong!" };
  }
}

module.exports = { signJWT };
