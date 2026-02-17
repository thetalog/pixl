const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function _oid(id) {
    return { $oid: String(id) };
}

function _unwrapOid(value) {
    if (value && typeof value === "object" && value.$oid) return String(value.$oid);
    return value;
}

function _unwrapDate(value) {
    if (!value) return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return value;
    if (typeof value === "number") return new Date(value).toISOString();
    if (typeof value === "object" && value.$date != null) {
        const d = value.$date;
        if (typeof d === "string") return d;
        if (typeof d === "number") return new Date(d).toISOString();
    }
    return value;
}

async function getDirectConversations(user, skip = 0, take = 50) {
    const meId = String(user?.id || "");
    if (!meId) {
        return { message: "Unauthorized", status: 401 };
    }

    const meOid = _oid(meId);

    const aggregated = await prisma.message
        .aggregateRaw({
            pipeline: [
                {
                    $match: {
                        $and: [
                            {
                                $or: [{ groupId: { $exists: false } }, { groupId: null }],
                            },
                            {
                                $or: [{ senderId: meOid }, { receiverId: meOid }],
                            },
                        ],
                    },
                },
                {
                    $addFields: {
                        otherUserId: {
                            $cond: [{ $eq: ["$senderId", meOid] }, "$receiverId", "$senderId"],
                        },
                    },
                },
                { $sort: { createdAt: -1 } },
                {
                    $group: {
                        _id: "$otherUserId",
                        latestMessage: { $first: "$$ROOT" },
                    },
                },
                { $skip: skip },
                { $limit: take },
                {
                    $project: {
                        _id: 0,
                        otherUserId: "$_id",
                        latestMessage: {
                            _id: "$latestMessage._id",
                            message: "$latestMessage.message",
                            mediaUrl: "$latestMessage.mediaUrl",
                            retracted: "$latestMessage.retracted",
                            senderId: "$latestMessage.senderId",
                            receiverId: "$latestMessage.receiverId",
                            createdAt: "$latestMessage.createdAt",
                            updatedAt: "$latestMessage.updatedAt",
                        },
                    },
                },
            ],
        })
        .catch((error) => {
            console.log(error);
            return null;
        });

    if (!aggregated) {
        await prisma.$disconnect();
        return { message: "Failed to fetch direct conversations", status: 500 };
    }

    const rows = Array.isArray(aggregated) ? aggregated : [];
    const otherIds = rows
        .map((r) => _unwrapOid(r.otherUserId))
        .filter((id) => typeof id === "string" && id.length > 0);

    const users = await prisma.user.findMany({
        where: {
            id: { in: otherIds },
        },
        select: {
            id: true,
            userName: true,
            name: true,
            profilePic: true,
        },
    });

    const userById = new Map(users.map((u) => [u.id, u]));

    const conversations = rows.map((r) => {
        const otherUserId = _unwrapOid(r.otherUserId);
        const latest = r.latestMessage || {};

        return {
            user: userById.get(otherUserId) || { id: otherUserId },
            latestMessage: {
                id: _unwrapOid(latest._id),
                message: latest.message,
                mediaUrl: latest.mediaUrl || [],
                retracted: Boolean(latest.retracted),
                senderId: _unwrapOid(latest.senderId),
                receiverId: _unwrapOid(latest.receiverId),
                createdAt: _unwrapDate(latest.createdAt),
                updatedAt: _unwrapDate(latest.updatedAt),
            },
        };
    });

    await prisma.$disconnect();
    return { conversations, status: 200 };
}

module.exports = { getDirectConversations };
