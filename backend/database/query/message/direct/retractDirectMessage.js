const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbRetractDirectMessage(user, messageId, senderUsername, re) {
  const getSenderUser = await prisma.user.findUnique({
    where: {
      userName: senderUsername,
    },
  });
  if (!getSenderUser) {
    return { message: "Sender not found", status: 404 };
  }
  if (getSenderUser?.id === user?.id) {
    return { message: "Sender and receiver are same", status: 400 };
  }
  const getmessage = await prisma.message.findUnique({
    where: {
      id: messageId,
      senderId: getSenderUser.id,
      receiverId: user?.id,
      retracted: false,
    },
  });
  if (!getmessage) {
    return { message: "Message not found or already retracted.", status: 404 };
  }
  const senderId = getSenderUser.id;
  const response = await prisma.message
    .update({
      where: {
        id: messageId,
        senderId: senderId,
        receiverId: user?.id,
      },
      data: {
        retracted: true,
      },
    })
    .then(async (response) => {
      return { message: "Direct Message Retract Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Direct Message Retract failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbRetractDirectMessage };
