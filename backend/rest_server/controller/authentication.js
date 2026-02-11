const jwt = require("jsonwebtoken");
const { getUserByEmailName } = require("../database/query/user/authentication/user");

async function authenticationController(authorizationToken) {
  try {
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!authorizationToken) {
      return { error: true, status: 401, message: "Token missing!" };
    }

    const token = authorizationToken.startsWith("Bearer ")
      ? authorizationToken.split(" ")[1]
      : authorizationToken;

    if (!token) {
      return { error: true, status: 401, message: "Invalid token!" };
    }

    let decoded;

    // ✅ CRITICAL: Stop execution if verification fails
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      console.log("JWT VERIFY FAILED:", err.message);
      return { error: true, status: 401, message: "Invalid or expired token!" };
    }

    // ✅ Validate payload
    if (!decoded?.email || !decoded?.name) {
      return { error: true, status: 401, message: "Invalid token payload!" };
    }

    const userResponse = await getUserByEmailName(
      decoded.email,
      decoded.name
    );

    if (userResponse?.error) {
      return { error: true, status: 401, message: "User not found!" };
    }

    return {
      error: false,
      status: 200,
      message: "Authorized!",
      details: userResponse.details,
    };
  } catch (error) {
    console.error(error);
    return { error: true, status: 500, message: "Internal server error!" };
  }
}

module.exports = { authenticationController };
