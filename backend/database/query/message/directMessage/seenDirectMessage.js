const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function dbSeenDirectMessage(user, senderUsername) {
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
  const senderId = getSenderUser.id;
  const response = await prisma.message
    .findMany({
      where: {
        senderId: senderId,
        receiverId: user?.id,
        seen: false,
      },
    })
    .then(async (response) => {
        if (response.length === 0) {
            return { message: "No new messages", status: 404 };
        }
        else{
            await prisma.message.updateMany({
                where: {
                senderId: senderId,
                receiverId: user?.id,
                seen: false,
                },  
                data: {
                seen: true,
                },
            });
          return { message: "Direct Message Seen Successfully", status: 201 };
        }
    })
    .catch((error) => {
      console.log(error);
      return { message: "Direct Message Seen failed", status: 500 };
    });
  await prisma.$disconnect();
  return response;
}

module.exports = { dbSeenDirectMessage };
