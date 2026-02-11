const express = require("express");

const {
    sendNotificationController,
    bulkNotificationController,
} = require("../controller/notification/sendNotifications");

const router = express.Router();

router.post("/send", sendNotificationController);
router.post("/bulk", bulkNotificationController);

module.exports = router;
