
const prisma = require("../../lib/prisma");

/**
 * Create new livestream
 */
async function createLiveStream(userId, title, url) {
    return await prisma.liveStream.create({
        data: {
            userId,
            title,
            url,
            viewers: []
        }
    });
}

/**
 * End livestream
 */
async function endLiveStream(liveId) {
    return prisma.liveStream.delete({
        where: { id: liveId }
    });
}

/**
 * Get active livestream
 */
async function getLiveStream(liveId) {
    return prisma.liveStream.findUnique({
        where: { id: liveId },
        include: {
            user: true,
            comments: {
                include: { user: true },
                orderBy: { createdAt: "asc" }
            }
        }
    });
}

/**
 * Add viewer
 */
async function addViewer(liveId, userId) {
    return prisma.liveStream.update({
        where: { id: liveId },
        data: {
            viewers: {
                push: userId
            }
        }
    });
}

/**
 * Remove viewer
 */
async function removeViewer(liveId, userId) {
    const stream = await prisma.liveStream.findUnique({
        where: { id: liveId }
    });

    return prisma.liveStream.update({
        where: { id: liveId },
        data: {
            viewers: stream.viewers.filter(v => v !== userId)
        }
    });
}

/**
 * Add chat message
 */
async function addLiveComment(liveId, userId, text) {
    const chat = await prisma.liveStreamComments.create({
        data: {
            liveId,
            userId,
            text
        },
        include: {
            user: {
                select: {
                    userName: true,
                    profilePic: true
                }
            }
        }
    });

    // 🔥 PUSH TO SOCKET CLIENTS
    if (global.io) {
        global.io.to(liveId).emit("newChat", chat);
        console.log("🔥 emitted newChat to", liveId);
    }

    return chat;
}

/**
 * Fetch chat
 */
async function getLiveComments(liveId) {
    return prisma.liveStreamComments.findMany({
        where: { liveId },
        include: { user: true },
        orderBy: { createdAt: "asc" }
    });
}

module.exports = {
    createLiveStream,
    endLiveStream,
    getLiveStream,
    addViewer,
    removeViewer,
    addLiveComment,
    getLiveComments
};
