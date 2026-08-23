const prisma = require("../../../lib/prisma");

async function getGroupMessages(user, groupId, skip = 0, take = 50) {
    const group = await prisma.group.findUnique({
        where: {
            groupId: groupId,
        },
        select: {
            id: true,
            groupId: true,
            name: true,
            displayPicture: true,
        },
    });

    if (!group) {
        return { message: "Group not found", status: 404 };
    }

    const isMember = await prisma.groupMember.findFirst({
        where: {
            groupId: group.id,
            userId: user?.id,
        },
        select: {
            id: true,
        },
    });

    if (!isMember) {
        return { message: "You are not a member of this group", status: 403 };
    }

    const response = await prisma.message
        .findMany({
            where: {
                groupId: group.id,
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
                groupId: true,
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
            },
        })
        .then(async (rows) => {
            return {
                group: {
                    groupId: group.groupId,
                    name: group.name,
                    displayPicture: group.displayPicture,
                },
                messages: rows,
                status: 200,
            };
        })
        .catch((error) => {
            console.log(error);
            return { message: "Failed to fetch group messages", status: 500 };
        });

    await prisma.$disconnect();
    return response;
}

module.exports = { getGroupMessages };
