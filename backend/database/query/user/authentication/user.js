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
      console.log(error)
      return null;
    });
  await prisma.$disconnect();
  return response;
}
async function getUserByEmailName(email, name) {
  const response = await prisma.user
    .findUnique({
      where: {
        email: email,
        name: name,
      },
    })
    .then((response) => {
      if (!response) return { status: 404, message: "User not found!" };
      return response;
    })
    .catch((error) => {
      return null;
    });
  await prisma.$disconnect();
  return response;
}
async function updateUser(updateWhere, data) {
  try {
    const response = await prisma.user.update({
      where: {
        ...updateWhere,
      },
      data: {
        ...data,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { getUserByCreds, getUserByEmailName, updateUser };
