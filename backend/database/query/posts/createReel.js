const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbCreateReel(
  userId,
  musicCredit,
  tags,
  caption,
  taggedUsers,
  files
) {
  console.log(files);
  const response = await prisma.reels
    .create({
      data: {
        taggedUsers: Array.isArray(taggedUsers) ? taggedUsers : [taggedUsers],
        caption: caption,
        tags: tags,
        media: {
          create: {
            url: files,
            musicCredit: musicCredit,
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
    .then(async (response) => {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          postsCount: {
            increment: 1,
          },
        },
      });
      return { message: "Post created Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Post failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbCreateReel };
