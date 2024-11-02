const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function signup(data) {
  const response = await prisma.user
    .create({
      data: {
        email: data?.email,
        name: data?.name,
        isEmailVerified: data?.isEmailVerified,
        password: data?.password,
      },
    })
    .then((response) => {
      return { message: "User created Successfully", status: 201 };
    })
    .catch((err) => {
      if (err?.code === "P2002")
        return { message: "User already registered", status: 409 };
      return { message: "User registration failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { signup };
