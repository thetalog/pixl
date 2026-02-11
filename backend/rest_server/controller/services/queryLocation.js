const getLocation = require("./external_api/getLocationQuery");

exports.queryLocationController = async (req, res) => {
  try {
    /* ================= VALIDATION ================= */

    const query = req.query.q;

    if (!query) {
      return res.status(400).json({
        message: "Query parameter is required",
      });
    }

    /* ================= EXTERNAL API ================= */

    const locationData = await getLocation(query);

    return res.status(200).json(locationData);

  } catch (error) {
    console.error("Query location controller error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
