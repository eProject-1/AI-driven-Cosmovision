
/**
 * maps.service.js
 * - Gọi Google Maps API.
 * - Chuyển địa chỉ thành tọa độ.
 * - Chuyển tọa độ thành địa chỉ.
 * - Tìm địa điểm gần user, ví dụ observatory, museum, science center.
 */

const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api";

async function geocodeAddress(address) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return {
        success: false,
        message: "GOOGLE_MAPS_API_KEY is missing in environment variables.",
      };
    }

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/geocode/json`, {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const result = response.data.results?.[0];

    if (!result) {
      return {
        success: false,
        message: "No location found for this address.",
      };
    }

    return {
      success: true,
      data: {
        formattedAddress: result.formatted_address,
        location: result.geometry.location,
        placeId: result.place_id,
        types: result.types,
      },
    };
  } catch (error) {
    console.error("Google Maps geocode error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to geocode address.",
      error: error.message,
    };
  }
}

async function reverseGeocode(lat, lng) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return {
        success: false,
        message: "GOOGLE_MAPS_API_KEY is missing in environment variables.",
      };
    }

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/geocode/json`, {
      params: {
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const result = response.data.results?.[0];

    if (!result) {
      return {
        success: false,
        message: "No address found for this coordinate.",
      };
    }

    return {
      success: true,
      data: {
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        types: result.types,
      },
    };
  } catch (error) {
    console.error("Google Maps reverse geocode error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to reverse geocode.",
      error: error.message,
    };
  }
}

async function searchNearbyPlaces({
  lat,
  lng,
  keyword = "observatory",
  radius = 10000,
}) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return {
        success: false,
        message: "GOOGLE_MAPS_API_KEY is missing in environment variables.",
      };
    }

    const response = await axios.get(
      `${GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json`,
      {
        params: {
          location: `${lat},${lng}`,
          radius,
          keyword,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const places = response.data.results?.map((place) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      location: place.geometry?.location,
      isOpenNow: place.opening_hours?.open_now,
      types: place.types,
    }));

    return {
      success: true,
      count: places.length,
      data: places,
    };
  } catch (error) {
    console.error("Google Maps nearby places error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to search nearby places.",
      error: error.message,
    };
  }
}

async function getPlaceDetails(placeId) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return {
        success: false,
        message: "GOOGLE_MAPS_API_KEY is missing in environment variables.",
      };
    }

    const response = await axios.get(
      `${GOOGLE_MAPS_BASE_URL}/place/details/json`,
      {
        params: {
          place_id: placeId,
          fields:
            "name,formatted_address,geometry,rating,user_ratings_total,opening_hours,website,formatted_phone_number",
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    );

    return {
      success: true,
      data: response.data.result,
    };
  } catch (error) {
    console.error("Google Maps place details error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to get place details.",
      error: error.message,
    };
  }
}

module.exports = {
  geocodeAddress,
  reverseGeocode,
  searchNearbyPlaces,
  getPlaceDetails,
};
