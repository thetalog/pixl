const express = require("express");
const multer = require("multer");
const path = require("path");

const { createPostController } = require("../controller/post/createPost");
const { createReelController } = require("../controller/post/createReel");
const { editPostCaptionController } = require("../controller/post/editCaption");
const { getAllPublicPostsController } = require("../controller/post/getPublicPosts");
const { getAllPublicReelsController } = require("../controller/post/getPublicReels");
const { getSinglePublicPostController } = require("../controller/post/getSinglePost");
const { postCommentController } = require("../controller/post/commentPost");
const { reelCommentController } = require("../controller/post/commentReel");
const { getFollowedPostsController } = require("../controller/post/getFollowedPosts");
const { likeOrUnlikePostController } = require("../controller/post/likePost");
const { getPostCommentsController } = require("../controller/post/getFollowedPostComments");
const { getReelCommentsController } = require("../controller/post/getFollowedReelComments");
const { updatePostSystemTagsController } = require("../controller/post/updatePostSystemTags");
const { updatePostUICategoryController } = require("../controller/post/updatePostUICategory");
const { getPostsByUICategoryController } = require("../controller/post/getPublicPostsByCategory");
const { likeOrUnlikeReelController } = require("../controller/post/likeReel");
const { generatePostShareLinkController } = require("../controller/post/sharePost");
const { getFollowedStoriesController } = require("../controller/post/getFollowedStories");
const { createStoryController } = require("../controller/post/createStory");
const { seenStoryController } = require("../controller/post/seenStory");
const { updatePostController } = require("../controller/post/updatePost");

const router = express.Router();

/* ================= MULTER ================= */

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, "uploads/"),
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

const upload = multer({ storage });

router.post("/create-post", upload.array("file", 10), createPostController);
router.post("/create-reel", upload.single("file"), createReelController);
router.patch("/edit-caption", editPostCaptionController);
router.get("/get-all-public-posts", getAllPublicPostsController);
router.get("/get-all-public-reels", getAllPublicReelsController);
router.get("/get-single-public-post", getSinglePublicPostController);
router.post("/:postId/comment", postCommentController);
router.post("/:reelId/reel-comment", reelCommentController);
router.get("/get-followed-posts", getFollowedPostsController);
router.patch("/like-or-unlike/:postId", likeOrUnlikePostController);
router.get("/comments", getPostCommentsController);
router.get("/reel-comments", getReelCommentsController);
router.post("/:postId/system-tags", updatePostSystemTagsController);
router.post("/:postId/update-ui-category/:category", updatePostUICategoryController);
router.get("/get-all-public-posts-by-ui-category", getPostsByUICategoryController);
router.patch("/reel/like-or-unlike/:reelId", likeOrUnlikeReelController);
router.get("/generate-post-share-link", generatePostShareLinkController);
router.get("/get-all-followed-stories", getFollowedStoriesController);
router.post("/create-stories", upload.single("file"), createStoryController);
router.post("/seen-stories", seenStoryController);
router.patch("/:postId", updatePostController);

module.exports = router;
