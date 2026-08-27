const prisma = require("../../lib/prisma");

async function listUserNotifications(userId, { take = 50 } = {}) {
  if (!userId) return { status: 401, message: "Unauthorized", data: [] };

  const data = await prisma.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Number(take) || 50, 100),
  });

  const unreadCount = await prisma.userNotification.count({
    where: { userId, read: false },
  });

  return { status: 200, data, unreadCount };
}

async function markNotificationsRead(userId, { ids } = {}) {
  if (!userId) return { status: 401, message: "Unauthorized" };

  const where = { userId, read: false };
  if (Array.isArray(ids) && ids.length) {
    where.id = { in: ids };
  }

  const result = await prisma.userNotification.updateMany({
    where,
    data: { read: true },
  });

  return { status: 200, message: "Marked as read", updated: result.count };
}

module.exports = { listUserNotifications, markNotificationsRead };
