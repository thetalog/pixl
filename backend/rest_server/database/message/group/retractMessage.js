const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function retractGroupMessage(user, groupId, messageId) {
  const getGroup = await prisma.group.findUnique({
    where: {
      groupId: groupId,
    },
  });
  if (!getGroup) {
    return { message: "Group not found", status: 404 };
  }
  const getmessage = await prisma.group.findUnique({
    where: {
      groupId: groupId,
      messages: {
        some: {
          id: messageId,
          senderId: user.userId,
        },
      },
    },
  });
  if (!getmessage) {
    return { message: "Message not found or already retracted.", status: 404 };
  }
  const response = await prisma.group
    .update({
      where: {
        groupId: groupId,
        messages: {
          some: {
            id: messageId,
          },
        },
      },
      data: {
        messages: {
          update: {
            where: {
              id: messageId,
            },
            data: {
              retract: true,
              reactions: {
                deleteMany: {
                  messageId: messageId,
                },
              },
            },
          },
        }
      },
    })
    .then(async (response) => {
      return { message: "Group Message Retract Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Group Message Retract failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { retractGroupMessage };
