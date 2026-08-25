const prisma = require("./prisma");

/**
 * Persist an in-app UserNotification (heart / Activity feed).
 * No FCM — moderation and product alerts show in /notifications only.
 */
async function notifyUser(userId, { message, type = "system", postId = null } = {}) {
  if (!userId || !message) {
    return { ok: false, error: "userId and message required" };
  }

  try {
    const notification = await prisma.userNotification.create({
      data: {
        userId,
        message,
        type,
        read: false,
        ...(postId ? { postId } : {}),
      },
    });
    return { ok: true, notification };
  } catch (error) {
    console.error("[notifyUser] DB error:", error.message || error);
    return { ok: false, error: error.message };
  }
}

module.exports = { notifyUser };
