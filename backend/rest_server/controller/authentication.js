const jwt = require("jsonwebtoken");
const { getUserByEmail } = require("../database/auth/user");

async function authenticationController(authorizationToken) {
  try {
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
      console.error("[auth] JWT_SECRET_KEY is not set");
      return { error: true, status: 500, message: "Server auth is not configured." };
    }

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
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      console.log("JWT VERIFY FAILED:", err.message);
      return { error: true, status: 401, message: "Invalid or expired token!" };
    }

    if (!decoded?.email || !decoded?.name) {
      return { error: true, status: 401, message: "Invalid token payload!" };
    }

    const userResponse = await getUserByEmail(decoded.email);

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
    console.error("[auth] unexpected error:", error);
    return {
      error: true,
      status: 500,
      message: "Authentication failed. Please sign in again.",
    };
  }
}

module.exports = { authenticationController };
