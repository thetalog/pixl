const prisma = require("../../../lib/prisma");

async function markGroupMessageAsSeen(user, groupId) {
  const response = await prisma.message
    .findMany({
      where: {
        groupId: {
          equals: groupId,
        },
        seen: {
          none: {
            userId: user?.id,
          },
        },
      },
    })
    .then(async (response) => {
      if (response.length === 0) {
        return { message: "No new messages", status: 404 };
      } else {
        const seenData = response.map((msg) => ({
          messageId: msg.id,
          userId: user?.id,
        }));

        // Create the 'seen' records
        await prisma.messageSeen.createMany({
          data: seenData,
        });

        return { message: "Group Message Seen Successfully", status: 201 };
      }
    })
    .catch((error) => {
      console.log(error);
      return { message: "Group Message Seen failed", status: 500 };
    });  return response;
}

module.exports = { markGroupMessageAsSeen };
