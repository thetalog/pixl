const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createPost(
  media,
  taggedPerson,
  location,
  caption
) {
  const response = await prisma.post
    .create({
      data: {
        media: media,
        taggedPerson: taggedPerson,
        location: location,
        caption: caption
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
