const axios = require("axios");

async function getLocation(query) {
  const apiKey = process.env.AZURE_MAPS_API_KEY;
  const url = `https://atlas.microsoft.com/search/fuzzy/json?api-version=1.0&query=${encodeURIComponent(
    query
  )}&subscription-key=${apiKey}`;

  try {
    const response = await axios.get(url);
    return response.data?.results?.map((result) => {
      return {
        address: result.address,
        position: result.position,
      };
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    throw error;
  }
}

module.exports = getLocation;
