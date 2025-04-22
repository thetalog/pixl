const express = require("express");
const {requestFollow} = require("../../controller/follow/request.js");
const router = express.Router();
router.post("/request", async (req, res) => {
  try {
    const { targetUsername } = req.body;
    const requestFollowResponse = await requestFollow(req.user, targetUsername);
    if (requestFollowResponse.status === 500) {
      return res.status(500).json({ message: requestFollowResponse.message });
    }
    if (requestFollowResponse.status !== 200) {
      return res.status(400).json({ message: requestFollowResponse.message });
    }
    res.status(200).json(requestFollowResponse);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
