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
    const data = {
      userId,
      message,
      type,
      ...(postId ? { postId } : {}),
    };

    let notification;
    try {
      notification = await prisma.userNotification.create({
        data: { ...data, read: false },
      });
    } catch (schemaErr) {
      // DB may not have `read` yet before prisma db push
      console.warn("[notifyUser] retry without read field:", schemaErr.message);
      notification = await prisma.userNotification.create({ data });
    }

    return { ok: true, notification };
  } catch (error) {
    console.error("[notifyUser] DB error:", error.message || error);
    return { ok: false, error: error.message };
  }
}

module.exports = { notifyUser };
