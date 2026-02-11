const { PrismaClient, GroupMemberRole } = require("@prisma/client");
const prisma = new PrismaClient();

async function createGroup(
  user,
  groupName,
  addedUsernames,
  groupId,
  groupDisplayPictureUrl
) {
  const getAddedUsers = [];
  for (let user of addedUsernames) {
    const addedUser = await prisma.user.findUnique({
      where: {
        userName: user,
      },
    });
    if (addedUser?.id) {
      getAddedUsers.push({
        userId: addedUser?.id,
        role: GroupMemberRole?.member,
      });
    }
  }
  getAddedUsers.push({ userId: user?.id, role: GroupMemberRole?.admin });

  const response = await prisma.group
    .create({
      data: {
        displayPicture:
          groupDisplayPictureUrl?.length > 0 ? groupDisplayPictureUrl[0] : "",
        adminId: user?.id,
        name: groupName,
        groupId: groupId,
        members: {
          createMany: {
            data: getAddedUsers,
          },
        },
      },
    })
    .then(async (response) => {
      return { message: "Group Created Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Group Creation failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { createGroup };
