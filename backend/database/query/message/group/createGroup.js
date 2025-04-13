const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbCreateGroup(
  user,
  groupName,
  groupDisplayPictureUrl,
  addedUsernames
) {
  const getAddedUsers = [];
  for (let user of addedUsernames) {
    const addedUser = await prisma.user.findUnique({
      where: {
        userName: receiverUsername,
      },
    });
    if (addedUser?.id) {
      getAddedUsers.push(addedUser?.id);
    }
  }

  const response = await prisma.group
    .create({
      data: {
        
        groupDisplayPictureUrl: groupDisplayPictureUrl
          ? groupDisplayPictureUrl
          : "",
      },
    })
    .then(async (response) => {
      return { message: "Direct Message Sent Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Direct Message failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbCreateGroup };
