const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbCreatePost(userId, taggedUsers, location, caption, files) {
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
        mentions: {
          createMany: {
            data: taggedUsers.map((taggedUser) => {
              return {
                userId: taggedUser,
              };
            }),
          },
        },
      },
    })
    .then((response) => {
      return { message: "Post created Successfully", status: 201 };
    })
    .catch((error) => {
      return { message: "Post failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbCreatePost };
