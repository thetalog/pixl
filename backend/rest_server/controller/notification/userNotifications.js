const {
  listUserNotifications,
  markNotificationsRead,
} = require("../../database/notification/userNotifications");

exports.getUserNotificationsController = async (req, res) => {
  try {
    const userId = req?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await listUserNotifications(userId, {
      take: req.query.take,
    });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

exports.markNotificationsReadController = async (req, res) => {
  try {
    const userId = req?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const ids = req.body?.ids;
    const result = await markNotificationsRead(userId, { ids });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return res.status(500).json({ message: "Failed to update notifications." });
  }
};
