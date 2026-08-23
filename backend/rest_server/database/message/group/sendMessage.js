const prisma = require("../../../lib/prisma");

async function sendGroupMessage(user, groupId, conversationId, message, mediaUrl) {
  const getGroup = await prisma.group.findUnique({
    where: {
      groupId: groupId,
    },
  });
  if (!getGroup) {
    return { message: "Group not found", status: 404 };
  }
  const response = await prisma.group
    .update({
      where: {
        groupId: groupId,
      },
      data: {
        messages: {
          create: {
            senderId: user?.id,
            message: message,
            mediaUrl: mediaUrl ? mediaUrl : [],
            conversationId: conversationId,
          },
        },
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

module.exports = { sendGroupMessage };
