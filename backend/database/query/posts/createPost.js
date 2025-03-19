const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createPost(tag, location, caption, files) {
  const response = await prisma.post
    .create({
      data: {
        tag,
        location,
        caption,
        files: files.map((file) => {
          return { url: file.path };
        }),
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

module.exports = { createPost };
