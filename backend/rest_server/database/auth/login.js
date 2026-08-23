const prisma = require("../../lib/prisma");

async function createLogin(
  email,
  userID,
  enteredPassword,
  isPasswordAuthenticated,
  IPAddress,
  responseMessage
) {
  const response = await prisma.login
    .create({
      data: {
        email: email,
        userId: userID,
        enteredPassword: enteredPassword,
        isPasswordAuthenticated: isPasswordAuthenticated,
        IPAddress: IPAddress,
        responseMessage: responseMessage,
      },
    })
    .then((response) => {
      return { message: "Login created Successfully", status: 201 };
    })
    .catch((error) => {
      return { message: "Login failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { createLogin };
