const express = require("express");
const { approveFollow } = require("../../controller/follow/approve.js");
const router = express.Router();
router.post("/approve", async (req, res) => {
  try {
    const { requestId, requesterUsername } = req.body;
    const approveFollowResponse = await approveFollow(
      req.user,
      requestId,
      requesterUsername
    );
    if (approveFollowResponse.status === 500) {
      return res.status(500).json({ message: approveFollowResponse.message });
    }
    if (approveFollowResponse.status !== 200) {
      return res.status(400).json({ message: approveFollowResponse.message });
    }
    res.status(200).json(approveFollowResponse);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
