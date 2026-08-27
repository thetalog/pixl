const express = require("express");
const router = express.Router();

const {
  internalStatusController,
  internalCommentController,
} = require("../controller/live/liveStream");

function internalSecret(req, res, next) {
  const expected = process.env.LIVE_INTERNAL_SECRET || "dev-internal-secret-change-me";
  const provided = req.headers["x-internal-secret"];
  if (!expected || provided !== expected) {
    return res.status(401).json({ message: "Invalid internal secret" });
  }
  return next();
}

router.post("/internal/live/:liveId/status", internalSecret, internalStatusController);
router.post("/internal/live/:liveId/comment", internalSecret, internalCommentController);

module.exports = router;
