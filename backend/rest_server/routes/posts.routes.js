const express = require("express");
const multer = require("multer");
const path = require("path");

const { createPostController } = require("../controller/posts/createPost");
const { createReelController } = require("../controller/posts/createReel");
const { editPostCaptionController } = require("../controller/posts/editCaption");
const { getAllPublicPostsController } = require("../controller/posts/getAllPublicPosts");
const { getAllPublicReelsController } = require("../controller/posts/getAllPublicReels");
const { getSinglePublicPostController } = require("../controller/posts/getSinglePublicPosts");
const { postCommentController } = require("../controller/posts/postComment");
const { reelCommentController } = require("../controller/posts/reelComment");
const { getFollowedPostsController } = require("../controller/posts/getAllFollowedPosts");
const { likeOrUnlikePostController } = require("../controller/posts/likeOrUnlikePost");
const { getPostCommentsController } = require("../controller/posts/getAllFollowedPostComments");
const { getReelCommentsController } = require("../controller/posts/getAllFollowedReelComments");
const { updatePostSystemTagsController } = require("../controller/posts/updatePostSystemTags");
const { updatePostUICategoryController } = require("../controller/posts/updatePostUICategory");
const { getPostsByUICategoryController } = require("../controller/posts/getAllPublicPostsByUICategory");
const { likeOrUnlikeReelController } = require("../controller/posts/likeOrUnlikeReel");
const { generatePostShareLinkController } = require("../controller/posts/postShareLinkGenerator");
const { getFollowedStoriesController } = require("../controller/posts/getAllFollowedStories");
const { createStoryController } = require("../controller/posts/createStories");
const { seenStoryController } = require("../controller/posts/seenStories");
const { updatePostController } = require("../controller/posts/updatePost");

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
