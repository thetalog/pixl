const { PrismaClient, ProfileVisibility } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbCheckAccountPrivacyStatus(user, targetUsername) {
  await prisma.user
    .findUnique({
      where: {
        userName: targetUsername,
      },
      select: {
        profileVisibility,
      },
    })
    .then(async (response) => {
      response?.profileVisibility === ProfileVisibility.PRIVATE ? true : false;
    })
    .catch((error) => {
      return { message: "Something went wrong", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbCheckAccountPrivacyStatus };
