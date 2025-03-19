const express = require("express");
const getLocation = require("../../controller/external_api/getLocationQuery");

const router = express.Router();

router.get("/query-location", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }
    const locationData = await getLocation(query);
    res.status(200).json(locationData);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;