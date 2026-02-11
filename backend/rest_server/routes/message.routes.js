const express = require("express");
const router = express.Router();

const {
    reactDirectMessageController,
} = require("../controller/message/direct/reactMessage");
const {
    retractDirectMessageController,
} = require("../controller/message/direct/retractMessage");
const {
    seenDirectMessageController,
} = require("../controller/message/direct/seenMessage");
const {
    sendDirectMessageController,
} = require("../controller/message/direct/sendMessage");

const {
    createGroupController,
} = require("../controller/message/group/createGroup");
const {
    reactGroupMessageController,
} = require("../controller/message/group/reactMessage");
const {
    retractGroupMessageController,
} = require("../controller/message/group/retractMessage");
const {
    seenGroupMessageController,
} = require("../controller/message/group/seenMessage");
const {
    sendGroupMessageController,
} = require("../controller/message/group/sendMessage");

const multer = require("multer");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
router.put("/direct/react-direct-message", reactDirectMessageController);
router.delete("/direct/retract-direct-message", retractDirectMessageController);
router.patch("/direct/seen-direct-message", seenDirectMessageController);
router.post(
    "/direct/send-message",
    upload.array("files"),
    sendDirectMessageController
);

router.post(
    "/group/create-group",
    upload.single("file"),
    createGroupController
);
router.put("/group/react-message", reactGroupMessageController);
router.delete("/group/retract-message", retractGroupMessageController);
router.patch("/group/seen-message", seenGroupMessageController);
router.post(
    "/send-message",
    upload.array("files"),
    sendGroupMessageController
);

module.exports = router;
