const prisma = require("../../../lib/prisma");

async function getDirectMessages(user, targetUsername, skip = 0, take = 50) {
    const targetUser = await prisma.user.findUnique({
        where: {
            userName: targetUsername,
        },
        select: {
            id: true,
            userName: true,
        },
    });

    if (!targetUser) {
        return { message: "User not found", status: 404 };
    }

    if (targetUser.id === user?.id) {
        return { message: "Target user cannot be the same as sender", status: 400 };
    }

    const messages = await prisma.message
        .findMany({
            where: {
                groupId: { isSet: false },
                OR: [
                    {
                        senderId: user?.id,
                        receiverId: targetUser.id,
                    },
                    {
                        senderId: targetUser.id,
                        receiverId: user?.id,
                    },
                ],
            },
            orderBy: {
                createdAt: "asc",
            },
            skip,
            take,
            select: {
                id: true,
                message: true,
                mediaUrl: true,
                retracted: true,
                replyTo: true,
                senderId: true,
                receiverId: true,
                createdAt: true,
                updatedAt: true,
                sender: {
                    select: {
                        id: true,
                        userName: true,
                        name: true,
                        profilePic: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        userName: true,
                        name: true,
                        profilePic: true,
                    },
                },
            },
        })
        .then(async (rows) => {
            return { messages: rows, status: 200 };
        })
        .catch((error) => {
            console.log(error);
            return { message: "Failed to fetch direct messages", status: 500 };
        });

    await prisma.$disconnect();
    return messages;
}

module.exports = { getDirectMessages };
