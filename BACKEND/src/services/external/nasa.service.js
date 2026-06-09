/**
 * nasa.service.js
 * - Gọi NASA API.
 * - Lấy Astronomy Picture of the Day.
 * - Lấy ảnh Mars Rover.
 * - Tìm kiếm media từ NASA Image and Video Library.
 */

const axios = require("axios");

const NASA_API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

const NASA_BASE_URL = "https://api.nasa.gov";
const NASA_IMAGES_BASE_URL = "https://images-api.nasa.gov";

async function getAstronomyPictureOfTheDay(date) {
  try {
    const response = await axios.get(`${NASA_BASE_URL}/planetary/apod`, {
      params: {
        api_key: NASA_API_KEY,
        date,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("NASA APOD error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to fetch astronomy picture of the day.",
      error: error.response?.data?.msg || error.message,
    };
  }
}

async function getMarsRoverPhotos({
  rover = "curiosity",
  sol = 1000,
  camera,
  page = 1,
}) {
  try {
    const params = {
      api_key: NASA_API_KEY,
      sol,
      page,
    };

    if (camera) {
      params.camera = camera;
    }

    const response = await axios.get(
      `${NASA_BASE_URL}/mars-photos/api/v1/rovers/${rover}/photos`,
      { params }
    );

    return {
      success: true,
      count: response.data.photos?.length || 0,
      data: response.data.photos || [],
    };
  } catch (error) {
    console.error("NASA Mars Rover error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to fetch Mars Rover photos.",
      error: error.response?.data?.msg || error.message,
    };
  }
}

async function searchNasaMedia(query, mediaType = "image") {
  try {
    const response = await axios.get(`${NASA_IMAGES_BASE_URL}/search`, {
      params: {
        q: query,
        media_type: mediaType,
      },
    });

    const items = response.data.collection?.items || [];

    const formattedItems = items.map((item) => {
      const itemData = item.data?.[0] || {};
      const link = item.links?.[0] || {};

      return {
        nasaId: itemData.nasa_id,
        title: itemData.title,
        description: itemData.description,
        dateCreated: itemData.date_created,
        mediaType: itemData.media_type,
        thumbnail: link.href,
      };
    });

    return {
      success: true,
      count: formattedItems.length,
      data: formattedItems,
    };
  } catch (error) {
    console.error("NASA media search error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to search NASA media.",
      error: error.message,
    };
  }
}

async function getNearEarthObjects(startDate, endDate) {
  try {
    const response = await axios.get(`${NASA_BASE_URL}/neo/rest/v1/feed`, {
      params: {
        api_key: NASA_API_KEY,
        start_date: startDate,
        end_date: endDate,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("NASA NEO error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to fetch near earth objects.",
      error: error.response?.data?.error_message || error.message,
    };
  }
}

module.exports = {
  getAstronomyPictureOfTheDay,
  getMarsRoverPhotos,
  searchNasaMedia,
  getNearEarthObjects,
};
