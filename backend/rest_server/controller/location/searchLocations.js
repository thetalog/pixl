const axios = require("axios");

/**
 * Location autocomplete via OpenStreetMap Nominatim (proxied to avoid CORS).
 * GET query: q (required), limit (optional, default 8)
 */
exports.searchLocationsController = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.query || "").trim();
    if (q.length < 2) {
      return res.status(200).json({ data: [] });
    }

    const limit = Math.min(Number(req.query.limit) || 8, 15);

    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q,
        format: "json",
        addressdetails: 1,
        limit,
      },
      headers: {
        "User-Agent": "PixlSocialApp/1.0 (location-autocomplete)",
        Accept: "application/json",
      },
      timeout: 8000,
    });

    const data = (Array.isArray(response.data) ? response.data : []).map((item) => {
      const address = item.address || {};
      const short =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        address.state ||
        "";
      const region = [short, address.state, address.country].filter(Boolean);
      const uniqueRegion = [...new Set(region)];

      return {
        id: String(item.place_id),
        name: item.display_name,
        label: uniqueRegion.length ? uniqueRegion.join(", ") : item.display_name,
        lat: item.lat ? Number(item.lat) : null,
        lon: item.lon ? Number(item.lon) : null,
        type: item.type || item.class || "",
      };
    });

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Location search error:", error.message || error);
    return res.status(502).json({
      message: "Location search unavailable right now.",
      data: [],
    });
  }
};
