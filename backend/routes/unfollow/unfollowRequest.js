const express = require("express");
const { unfollowRequest } = require("../../controller/unfollow/unfollowRequest.js");
const router = express.Router();
router.post("/", async (req, res) => {
  try {
    const { targetUsername } = req.body;
    const unfollowResponse = await unfollowRequest(
      req.user,
      targetUsername
    );
    if (unfollowResponse.status === 500) {
      return res.status(500).json({ message: unfollowResponse.message });
    }
    if (unfollowResponse.status !== 200) {
      return res.status(400).json({ message: unfollowResponse.message });
    }
    res.status(200).json(unfollowResponse);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
