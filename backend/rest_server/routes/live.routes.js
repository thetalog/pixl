const express = require("express");
const router = express.Router();

const {
  startLiveController,
  endLiveController,
  getLiveController,
  listLiveController,
  getLiveByUsernameController,
  joinLiveController,
  leaveLiveController,
  addLiveCommentController,
  getLiveCommentsController,
  getLiveViewersController,
  startLiveCommentSocketController,
} = require("../controller/live/liveStream");

router.get("/", listLiveController);
router.get("/user/:username", getLiveByUsernameController);
router.post("/start", startLiveController);
router.delete("/:liveId", endLiveController);
router.get("/:liveId", getLiveController);
router.post("/:liveId/join", joinLiveController);
router.post("/:liveId/leave", leaveLiveController);
router.post("/:liveId/comment", addLiveCommentController);
router.get("/:liveId/comments", getLiveCommentsController);
router.get("/:liveId/viewers", getLiveViewersController);
router.get("/:liveId/comments/socket", startLiveCommentSocketController);

module.exports = router;
