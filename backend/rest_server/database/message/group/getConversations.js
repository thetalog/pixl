const prisma = require("../../../lib/prisma");

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

async function getGroupConversations(user, skip = 0, take = 50) {
    const meId = String(user?.id || "");
    if (!meId) {
        return { message: "Unauthorized", status: 401 };
    }

    const memberships = await prisma.groupMember.findMany({
        where: {
            userId: meId,
        },
        select: {
            groupId: true,
            group: {
                select: {
                    id: true,
                    groupId: true,
                    name: true,
                    displayPicture: true,
                },
            },
        },
    });

    const allGroups = memberships.map((m) => m.group).filter(Boolean);

    // Pagination happens at group list level.
    const pagedGroups = allGroups.slice(skip, skip + take);
    const internalGroupIds = pagedGroups.map((g) => g.id);

    let latestByGroupId = new Map();

    if (internalGroupIds.length > 0) {
        const groupOids = internalGroupIds.map(_oid);

        const aggregated = await prisma.message
            .aggregateRaw({
                pipeline: [
                    {
                        $match: {
                            groupId: { $in: groupOids },
                        },
                    },
                    { $sort: { createdAt: -1 } },
                    {
                        $group: {
                            _id: "$groupId",
                            latestMessage: { $first: "$$ROOT" },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            groupId: "$_id",
                            latestMessage: {
                                _id: "$latestMessage._id",
                                message: "$latestMessage.message",
                                mediaUrl: "$latestMessage.mediaUrl",
                                retracted: "$latestMessage.retracted",
                                senderId: "$latestMessage.senderId",
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
            return { message: "Failed to fetch group conversations", status: 500 };
        }

        const rows = Array.isArray(aggregated) ? aggregated : [];
        latestByGroupId = new Map(
            rows.map((r) => [_unwrapOid(r.groupId), r.latestMessage])
        );
    }

    const conversations = pagedGroups.map((g) => {
        const latest = latestByGroupId.get(g.id);
        return {
            group: {
                groupId: g.groupId,
                name: g.name,
                displayPicture: g.displayPicture,
            },
            latestMessage: latest
                ? {
                    id: _unwrapOid(latest._id),
                    message: latest.message,
                    mediaUrl: latest.mediaUrl || [],
                    retracted: Boolean(latest.retracted),
                    senderId: _unwrapOid(latest.senderId),
                    createdAt: _unwrapDate(latest.createdAt),
                    updatedAt: _unwrapDate(latest.updatedAt),
                }
                : null,
        };
    });

    // Sort by latest message time (desc), keep nulls last.
    conversations.sort((a, b) => {
        const ad = a.latestMessage?.createdAt ? Date.parse(a.latestMessage.createdAt) : 0;
        const bd = b.latestMessage?.createdAt ? Date.parse(b.latestMessage.createdAt) : 0;
        return bd - ad;
    });

    await prisma.$disconnect();
    return { conversations, status: 200 };
}

module.exports = { getGroupConversations };
