const express = require("express");
const { rejectFollow } = require("../../controller/follow/reject.js");
const router = express.Router();
router.post("/reject", async (req, res) => {
  try {
    const { requestId, requesterUsername } = req.body;
    const rejectFollowResponse = await rejectFollow(
      req.user,
      requestId,
      requesterUsername
    );
    if (rejectFollowResponse.status === 500) {
      return res.status(500).json({ message: rejectFollowResponse.message });
    }
    if (rejectFollowResponse.status !== 200) {
      return res.status(400).json({ message: rejectFollowResponse.message });
    }
    res.status(200).json(rejectFollowResponse);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
