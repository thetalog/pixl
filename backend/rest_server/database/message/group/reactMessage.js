const prisma = require("../../../lib/prisma");

async function addGroupMessageReaction(user,
  groupId,
  messageId,
  emoji) {
  const getGroup = await prisma.group.findUnique({
    where: {
      groupId: groupId,
    },
  });
  if (!getGroup) {
    return { message: "Group not found", status: 404 };
  }
  const getMessage = await prisma.group.findUnique({
   where:{
    groupId: groupId,
    messages:{
      some:{
        id:messageId,
      }
    }
   }
  });
  if (!getMessage) {
    return { message: "Message not found", status: 404 };
  }
  const response = await prisma.group
    .update({
      where: {
        groupId: groupId,
        messages: {
          some: {
            id: messageId,
          },
        }
      },
      data: {
        messages: {
          update: {
            where: {
              id: messageId,
            },
            data: {
              reactions: {
                create: {
                  emoji: emoji,
                  userId: user.userId,
                },
              },
            },
          },
        }
      },
    })
    .then(async (response) => {
      return { message: "Group Message React Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Group Message React failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { addGroupMessageReaction };
