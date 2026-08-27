const prisma = require("../../lib/prisma");

async function createLogin(
  email,
  userID,
  enteredPassword,
  isPasswordAuthenticated,
  IPAddress,
  responseMessage
) {
  try {
    const data = {
      email,
      enteredPassword,
      isPasswordAuthenticated,
      IPAddress: IPAddress || "unknown",
      responseMessage: responseMessage || "",
    };

    // MongoDB ObjectId fields must be omitted when null (not set to null).
    if (userID) data.userId = userID;

    await prisma.login.create({ data });
    return { message: "Login created Successfully", status: 201 };
  } catch (error) {
    console.error("createLogin audit failed:", error.message || error);
    return { message: "Login audit failed", status: 500 };
  }
}

module.exports = { createLogin };
