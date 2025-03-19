const {
  getUserByEmailName,
} = require("../database/query/user/authentication/user");
const jwt = require("jsonwebtoken");

async function authenticationController(authorizationToken) {
  try {
    const secretKey = process.env.JWT_SECRET_KEY;
    var decodedToken = jwt.verify(
      String(authorizationToken).split(" ")[1],
      secretKey,
      {
        algorithm: "HS256",
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
        if (
          decodedToken?.email === isUserFound.email &&
          decodedToken?.name === isUserFound.name
        ) {
          return {
            status: 200,
            message: "Authorized!",
            user: isUserFound,
          };
        } else {
          return { status: 404, message: "Unauthorized!" };
        }
      }
    } else {
      return { status: 404, message: "Invalid Token!" };
    }
  } catch (error) {
    console.error("Error in authenticationController:", error);
    return { status: 500, message: "Something went wrong!" };
  }
}

module.exports = { authenticationController };
