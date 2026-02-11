const fcmClient = require("../../lib/fcmClient");

/* ================= SEND SINGLE ================= */

const sendNotificationController = async (req, res) => {
    try {
        const { token, title, body, data } = req.body;

        /* ---------- Validation ---------- */

        if (!token) return res.status(400).json({ error: "token is required" });
        if (!title) return res.status(400).json({ error: "title is required" });
        if (!body) return res.status(400).json({ error: "body is required" });

        if (typeof token !== "string" || token.length < 10) {
            return res.status(400).json({ error: "Invalid token format" });
        }

        if (data && typeof data !== "object") {
            return res.status(400).json({ error: "data must be an object" });
        }

        /* ---------- FCM ---------- */

        const result = await fcmClient.sendNotification({
            token,
            title,
            body,
            data: data || {},
        });

        return res.status(200).json({
            success: true,
            messageId: result.messageId,
            response: result.response,
        });

    } catch (error) {
        console.error("Send notification controller error:", error.message);

        if (error.message?.includes("Invalid token")) {
            return res.status(400).json({ error: "Invalid device token" });
        }

        return res.status(500).json({
            error: "Failed to send notification",
        });
    }
};

/* ================= BULK SEND ================= */

const bulkNotificationController = async (req, res) => {
    try {
        const { notifications } = req.body;

        /* ---------- Validation ---------- */

        if (!Array.isArray(notifications)) {
            return res.status(400).json({
                error: "notifications must be an array",
            });
        }

        if (!notifications.length) {
            return res.status(400).json({
                error: "notifications array cannot be empty",
            });
        }

        if (notifications.length > 100) {
            return res.status(400).json({
                error: "Maximum 100 notifications allowed",
            });
        }

        for (let i = 0; i < notifications.length; i++) {
            const n = notifications[i];

            if (!n.token || !n.title || !n.body) {
                return res.status(400).json({
                    error: `Notification at index ${i} missing required fields`,
                });
            }
        }

        /* ---------- FCM ---------- */

        const results = await fcmClient.sendBulkNotifications(notifications);

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        return res.status(200).json({
            success: true,
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            results,
        });

    } catch (error) {
        console.error("Bulk notification controller error:", error.message);

        return res.status(500).json({
            error: "Failed to send bulk notifications",
        });
    }
};

module.exports = {
    sendNotificationController,
    bulkNotificationController,
};
