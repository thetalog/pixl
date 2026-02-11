const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbGetPostBy(by = "userId", id) {
  let response;
  if (by === "userId") {
    response = await prisma.post
      .findMany({ where: { userId: id } })
      .then((response) => {
        return {
          message: "Post fetched Successfully",
          status: 201,
          data: response,
        };
      })
      .catch((error) => {
        return { message: "Post fetched failed", status: 500 };
      });
  } else if (by === "postId") {
    response = await prisma.post
      .findUnique({ where: { id: id } })
      .then((response) => {
        return {
          message: "Post fetched Successfully",
          status: 201,
          data: response,
        };
      })
      .catch((error) => {
        return { message: "Post fetched failed", status: 500 };
      });
  }
  await prisma.$disconnect();
  return response;
}

module.exports = { dbGetPostBy };
