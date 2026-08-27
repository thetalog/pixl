const { getSuggestedUsers } = require("../../database/user/getSuggestedUsers");

exports.getSuggestedUsersController = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized", data: [] });
    }

    const take = req.query.take;
    const response = await getSuggestedUsers(user, { take });

    if (response.status === 500) {
      return res.status(500).json({
        message: response.message || "Failed to fetch suggested users.",
        data: [],
      });
    }

    return res.status(200).json({
      message: response.message,
      data: response.data || [],
    });
  } catch (error) {
    console.error("getSuggestedUsersController error:", error);
    return res.status(500).json({ message: "Something went wrong.", data: [] });
  }
};
