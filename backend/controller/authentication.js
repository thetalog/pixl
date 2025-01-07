const {
  getUserByEmailName,
} = require("../database/query/user/authentication/user");
const jwt = require("jsonwebtoken");
const fs = require("fs");
async function authenticationController(authorizationToken) {
  try {
    var publicKey = fs.readFileSync("./routes/authentication/pixl");
    var decodedToken = jwt.verify(
      String(authorizationToken).split(" ")[1],
      publicKey,
      {
        algorithm: "RS256",
      }
    );
    const isUserFound = await getUserByEmailName(
      decodedToken?.email,
      decodedToken?.name
    );
    if (isUserFound.id !== "") {
      if (decodedToken?.exp < Math.round(new Date().getTime() / 1000)) {
        return { status: 401, message: "Token expired!" };
      } else {
        if (isUserFound?.latestJWT !== String(authorizationToken).split(" ")[1]) return {status: 401, message: "Unauthorized"}
          return { status: 200, message: "Authorized!" };
      }
    } else {
      return { status: 404, message: "Invalid Token!" };
    }
  } catch (error) {
    return { status: 500, message: "Something went wrong!" };
  }
}

module.exports = { authenticationController };
