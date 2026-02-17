const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function retractDirectMessage(user, receiverUsername, messageId) {
  const getReceiverUser = await prisma.user.findUnique({
    where: {
      userName: receiverUsername,
    },
  });
  if (!getReceiverUser) {
    return { message: "Receiver not found", status: 404 };
  }
  if (getReceiverUser?.id === user?.id) {
    return { message: "Sender and receiver are same", status: 400 };
  }

  const getMessage = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: user?.id,
      receiverId: getReceiverUser.id,
      retracted: false,
    },
  });
  if (!getMessage) {
    return { message: "Message not found or already retracted.", status: 404 };
  }

  const response = await prisma.message
    .update({
      where: {
        id: getMessage.id,
      },
      data: {
        retracted: true,
      },
    })
    .then(async () => {
      return { message: "Direct Message Retract Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error);
      return { message: "Direct Message Retract failed", status: 500 };
    });

  await prisma.$disconnect();
  return response;
}

module.exports = { retractDirectMessage };
