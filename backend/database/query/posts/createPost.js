const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function db_createPost(userId, taggedUsers, location, caption, files) {
  const response = await prisma.post
    .create({
      data: {
        taggedUsers: Array.isArray(taggedUsers) ? taggedUsers : [taggedUsers],
        location: location,
        caption: caption,
        media: {
          create: {
            url: files,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
    })
    .then((response) => {
      return { message: "Post created Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Post failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { db_createPost };
