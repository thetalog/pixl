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
      console.log(err);
      return { message: "User registration failed", status: 500 };
    });
  prisma.$disconnect();
  return response;
}

module.exports = { signup };
