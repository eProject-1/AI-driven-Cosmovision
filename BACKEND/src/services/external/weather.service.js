/**
 * weather.service.js
 * - Gọi OpenWeather API.
 * - Lấy thời tiết hiện tại theo tên thành phố.
 * - Lấy dự báo thời tiết.
 * - Chuẩn hóa dữ liệu trước khi trả về controller/chatbot.
 */

const axios = require("axios");

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

function formatCurrentWeather(data) {
  return {
    city: data.name,
    country: data.sys?.country,
    coordinates: {
      lat: data.coord?.lat,
      lon: data.coord?.lon,
    },
    temperature: data.main?.temp,
    feelsLike: data.main?.feels_like,
    humidity: data.main?.humidity,
    pressure: data.main?.pressure,
    condition: data.weather?.[0]?.main,
    description: data.weather?.[0]?.description,
    windSpeed: data.wind?.speed,
    cloudiness: data.clouds?.all,
    sunrise: data.sys?.sunrise,
    sunset: data.sys?.sunset,
  };
}

async function getCurrentWeatherByCity(city, units = "metric") {
  try {
    if (!OPENWEATHER_API_KEY) {
      return {
        success: false,
        message: "OPENWEATHER_API_KEY is missing in environment variables.",
      };
    }

    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        q: city,
        appid: OPENWEATHER_API_KEY,
        units,
      },
    });

    return {
      success: true,
      data: formatCurrentWeather(response.data),
      raw: response.data,
    };
  } catch (error) {
    console.error("OpenWeather current weather error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to fetch current weather.",
      error: error.response?.data?.message || error.message,
    };
  }
}

async function getCurrentWeatherByCoordinates(lat, lon, units = "metric") {
  try {
    if (!OPENWEATHER_API_KEY) {
      return {
        success: false,
        message: "OPENWEATHER_API_KEY is missing in environment variables.",
      };
    }

    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units,
      },
    });

    return {
      success: true,
      data: formatCurrentWeather(response.data),
      raw: response.data,
    };
  } catch (error) {
    console.error("OpenWeather coordinate weather error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to fetch weather by coordinates.",
      error: error.response?.data?.message || error.message,
    };
  }
}

async function getWeatherForecast(city, units = "metric") {
  try {
    if (!OPENWEATHER_API_KEY) {
      return {
        success: false,
        message: "OPENWEATHER_API_KEY is missing in environment variables.",
      };
    }

    const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: OPENWEATHER_API_KEY,
        units,
      },
    });

    const forecast = response.data.list?.map((item) => ({
      dateTime: item.dt_txt,
      temperature: item.main?.temp,
      feelsLike: item.main?.feels_like,
      humidity: item.main?.humidity,
      condition: item.weather?.[0]?.main,
      description: item.weather?.[0]?.description,
      windSpeed: item.wind?.speed,
    }));

    return {
      success: true,
      city: response.data.city,
      count: forecast.length,
      data: forecast,
    };
  } catch (error) {
    console.error("OpenWeather forecast error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to fetch weather forecast.",
      error: error.response?.data?.message || error.message,
    };
  }
}

module.exports = {
  getCurrentWeatherByCity,
  getCurrentWeatherByCoordinates,
  getWeatherForecast,
};