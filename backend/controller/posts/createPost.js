async function createPost(req, res, next) {
  try {
    res.status(200).json({
      message: "Post created successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
}