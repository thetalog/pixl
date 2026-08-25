const express = require("express");
const { searchLocationsController } = require("../controller/location/searchLocations");

const router = express.Router();

router.get("/services/locations", searchLocationsController);

module.exports = router;