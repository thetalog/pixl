const express = require("express");
const router = express.Router();

const {
    startLiveController,
    endLiveController,
    getLiveController,
    joinLiveController,
    leaveLiveController,
    addLiveCommentController,
    getLiveCommentsController,
    startLiveCommentSocketController,
} = require("../controller/live/live");

router.post("/start", startLiveController);
router.delete("/:liveId", endLiveController);
router.get("/:liveId", getLiveController);
router.post("/:liveId/join", joinLiveController);
router.post("/:liveId/leave", leaveLiveController);
router.post("/:liveId/comment", addLiveCommentController);
router.get("/:liveId/comments", getLiveCommentsController);
router.get("/:liveId/comments/socket", startLiveCommentSocketController);

module.exports = router;
