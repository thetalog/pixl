const express = require("express");
const { checkUsernameExist } = require("../controller/checkUsernameExist");
const { searchUserController } = require("../controller/users/searchSingleUser");
const { searchUsersController } = require("../controller/users/searchUsers");
const { getOwnProfileController } = require("../controller/profile/getOwnProfile");
const { approveFollowController } = require("../controller/follow/approve");
const { rejectFollowController } = require("../controller/follow/reject");
const { requestFollowController } = require("../controller/follow/request");
const { getIncomingFollowRequestsController } = require("../controller/follow/getIncomingFollowRequest.js");
const { changeProfileVisibilityController } = require("../controller/follow/changeProfileVisibility.js");
const { removeFollowRequestController } = require("../controller/follow/removeFollowingRequest.js");
const { removeFollowingController } = require("../controller/follow/removeFollowing.js");
const { getFollowStatusController } = require("../controller/follow/getFollowStatus.js");

const router = express.Router();
router.post("/check-username", checkUsernameExist);
router.get("/search", searchUserController);
router.get("/search/all", searchUsersController);
router.get("/profile", getOwnProfileController);
router.post("/follow/approve", approveFollowController);
router.post("/follow/reject", rejectFollowController);
router.post("/follow/request", requestFollowController);
router.get("/get-incoming-follow-request", getIncomingFollowRequestsController);
router.patch("/remove-follow-request", removeFollowRequestController);
router.patch("/remove-following", removeFollowingController);
router.get("/get-follow-status", getFollowStatusController);
router.patch(
    "/change-profile-visibility",
    changeProfileVisibilityController
);
module.exports = router;