const prisma = require("../../lib/prisma");

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: true };
  }

  return { error: false, details: user };
}


async function getUserByEmailAndPassword(email, hashedPassword) {
  try {
    const response = await prisma.user.findFirst({
      where: {
        email: email,
        password: hashedPassword,
      },
    });

    if (!response) {
      return { error: true, status: 404 };
    }

    return response;
  } catch (error) {
    console.log(error);
    return null;
  }
}
async function getUserByEmail(email) {
  const response = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!response) {
    return { error: true, status: 404, message: "User not found!" };
  }

  return {
    error: false,
    status: 200,
    message: "User found!",
    details: response,
  };
}

async function updateUser(selector, updateData) {
  try {
    const response = await prisma.user.update({
      where: selector,
      data: updateData,
    });

    return response;
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { getUserById, getUserByEmailAndPassword, getUserByEmail, updateUser };