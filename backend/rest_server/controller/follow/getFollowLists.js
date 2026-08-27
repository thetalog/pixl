const { getFollowersByUsername, getFollowingByUsername } = require("../../database/follow/getFollowLists");

exports.getFollowersController = async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ message: "username is required." });
    }

    const response = await getFollowersByUsername(username);
    return res.status(response.status || 200).json({
      message: response.message,
      data: response.data || [],
    });
  } catch (error) {
    console.error("Get followers controller error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

exports.getFollowingController = async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ message: "username is required." });
    }

    const response = await getFollowingByUsername(username);
    return res.status(response.status || 200).json({
      message: response.message,
      data: response.data || [],
    });
  } catch (error) {
    console.error("Get following controller error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};
