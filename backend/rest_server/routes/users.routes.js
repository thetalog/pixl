const express = require("express");
const { checkUsernameExist } = require("../controller/user/checkUsername");
const { searchUserController } = require("../controller/user/searchSingleUser");
const { searchUsersController } = require("../controller/user/searchUsers");
const { getOwnProfileController } = require("../controller/profile/getOwnProfile");
const { approveFollowController } = require("../controller/follow/approveFollow");
const { rejectFollowController } = require("../controller/follow/rejectFollow");
const { requestFollowController } = require("../controller/follow/requestFollow");
const { getIncomingFollowRequestsController } = require("../controller/follow/getIncomingFollowRequests.js");
const { changeProfileVisibilityController } = require("../controller/follow/changeProfileVisibility.js");
const { removeFollowRequestController } = require("../controller/follow/removeFollowRequest.js");
const { removeFollowingController } = require("../controller/follow/removeFollowing.js");
const { getFollowStatusController } = require("../controller/follow/getFollowStatus.js");
const { getFollowersController, getFollowingController } = require("../controller/follow/getFollowLists.js");
const {
  getUserNotificationsController,
  markNotificationsReadController,
} = require("../controller/notification/userNotifications");
const { getSuggestedUsersController } = require("../controller/user/getSuggestedUsers");

const router = express.Router();
router.post("/check-username", checkUsernameExist);
router.get("/search/get-profile-by-username", searchUserController);
router.get("/search/all", searchUsersController);
router.get("/profile", getOwnProfileController);
router.get("/suggested", getSuggestedUsersController);
router.get("/notifications", getUserNotificationsController);
router.patch("/notifications/read", markNotificationsReadController);
router.post("/follow/approve", approveFollowController);
router.post("/follow/reject", rejectFollowController);
router.post("/follow/request", requestFollowController);
router.get("/get-incoming-follow-request", getIncomingFollowRequestsController);
router.patch("/remove-follow-request", removeFollowRequestController);
router.patch("/remove-following", removeFollowingController);
router.get("/get-follow-status", getFollowStatusController);
router.get("/followers", getFollowersController);
router.get("/following", getFollowingController);
router.patch(
    "/change-profile-visibility",
    changeProfileVisibilityController
);
module.exports = router;