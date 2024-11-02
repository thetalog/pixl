const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getUserByCreds(email, hashedPassword) {
  const response = await prisma.user
    .findUnique({
      where: {
        email: email,
        password: hashedPassword,
      },
    })
    .then((response) => {
      if (!response)
        return { status: 404, message: "Credentials does not match." };
      return response;
    })
    .catch((error) => {
      return null;
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { getUserByCreds };
