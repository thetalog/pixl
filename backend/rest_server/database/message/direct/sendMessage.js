const prisma = require("../../../lib/prisma");

async function sendDirectMessage(user, receiverUsername, message, mediaUrl) {
  const getReceiverUser = await prisma.user.findUnique({
    where: {
      userName: receiverUsername,
    },
  });
  if (!getReceiverUser) {
    return { message: "Receiver not found", status: 404 };
  }
  const receiverId = getReceiverUser.id;
  const response = await prisma.message
    .create({
      data: {
        receiverId: receiverId,
        senderId: user?.id,
        message: message,
        mediaUrl: mediaUrl ? mediaUrl : [],
      },
    })
    .then(async (response) => {
      return { message: "Direct Message Sent Successfully", status: 201 };
    })
    .catch((error) => {
      console.log(error)
      return { message: "Direct Message failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { sendDirectMessage };
