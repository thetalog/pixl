const { PrismaClient, ProfileVisibility } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUserPrivacyStatus(targetUsername) {
  return await prisma.user
    .findUnique({
      where: {
        userName: targetUsername,
      }
    })
    .then(async (response) => {
      if (response === null) {
        return { error: "Target User Not Found", status: 404 };
      }
      response?.profileVisibility === ProfileVisibility.PRIVATE ? true : false;
      return response;
    })
    .catch((error) => {
      return { message: "Something went wrong", status: 500 };
    }).
    finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { checkUserPrivacyStatus };
