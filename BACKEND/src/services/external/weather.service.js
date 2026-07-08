import prisma from "../../config/db.js";
import { AppError } from "../../utils/app.error.util.js";
import { createLogger } from "../../utils/logger.util.js";

const OWM_BASE_URL = "https://api.openweathermap.org/data/2.5";
const API_KEY = process.env.OPENWEATHER_API_KEY;
const CACHE_TTL_MIN = parseInt(process.env.WEATHER_CACHE_TTL_MINUTES || "30", 10);
const FETCH_TIMEOUT_MS = 8000;
const logger = createLogger("weather");

export function roundCoord(value) {
  return Math.round(value * 100) / 100;
}

export async function cleanupExpiredWeatherCache() {
  try {
    const result = await prisma.weatherCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    if (result.count > 0) {
      logger.info("Expired weather cache cleaned", { count: result.count });
    }

    return result.count;
  } catch (error) {
    logger.error("Clean expired weather cache failed", error);
    return 0;
  }
}

export async function getWeatherByCoords(lat, lon) {
  const latRounded = roundCoord(lat);
  const lonRounded = roundCoord(lon);
  const cached = await getCachedWeather(latRounded, lonRounded);

  if (cached) return cacheRowToWeatherData(cached);
  if (!API_KEY) return getMockWeather(lat, lon);

  const apiWeather = await fetchOpenWeatherMap(lat, lon);
  void upsertWeatherCache(latRounded, lonRounded, apiWeather);
  return apiWeather;
}

export function getWeatherConditionLabel(condition) {
  const labels = {
    clear: "Clear",
    partly_cloudy: "Partly cloudy",
    cloudy: "Cloudy",
    rainy: "Rainy",
    foggy: "Foggy",
  };

  return labels[condition] ?? "Unknown";
}

export const getCurrentWeatherByCoordinates = getWeatherByCoords;

async function fetchOpenWeatherMap(lat, lon) {
  const url = `${OWM_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=en`;

  let response;
  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    logger.error("OpenWeatherMap timeout", error);
    return getMockWeather(lat, lon);
  }

  if (!response.ok) {
    if (response.status === 401) {
      logger.error("OpenWeatherMap API key is inactive or invalid");
      return getMockWeather(lat, lon);
    }

    const body = await response.json().catch(() => ({}));
    throw new AppError(`OpenWeatherMap failed: ${body?.message || response.status}`, 502);
  }

  return mapOpenWeatherResponse(await response.json());
}

async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function mapOpenWeatherResponse(data) {
  const { condition, label } = mapOwmCondition(data.weather);

  return {
    condition,
    label,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    cloudCover: data.clouds?.all ?? 0,
    windSpeed: Math.round((data.wind?.speed ?? 0) * 3.6),
    visibility: Math.round((data.visibility ?? 10000) / 1000),
    description: data.weather[0]?.description ?? "",
    cityName: data.name || null,
    countryCode: data.sys?.country || null,
    sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000) : null,
    sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000) : null,
    isMock: false,
    fromCache: false,
  };
}

function mapOwmCondition(weather = []) {
  const id = weather[0]?.id;
  if (!id || id === 800) return { condition: "clear", label: "Clear" };
  if (id >= 200 && id < 600) return { condition: "rainy", label: "Rain" };
  if (id >= 600 && id < 700) return { condition: "cloudy", label: "Snow" };
  if (id >= 700 && id < 800) return { condition: "foggy", label: "Fog" };
  if (id === 801) return { condition: "partly_cloudy", label: "Partly cloudy" };
  if (id >= 802) return { condition: "cloudy", label: "Cloudy" };
  return { condition: "clear", label: "Clear" };
}

function getMockWeather(lat, lon) {
  logger.warn("Using mock weather because OPENWEATHER_API_KEY is missing");
  return {
    condition: "clear",
    label: "Clear (mock)",
    temperature: 25,
    feelsLike: 27,
    humidity: 60,
    cloudCover: 10,
    windSpeed: 5,
    visibility: 10,
    description: "clear sky",
    cityName: null,
    countryCode: null,
    sunrise: null,
    sunset: null,
    isMock: true,
    lat,
    lon,
  };
}

async function getCachedWeather(latRounded, lonRounded) {
  try {
    const cached = await prisma.weatherCache.findUnique({
      where: { latRounded_lonRounded: { latRounded, lonRounded } },
    });

    if (!cached || new Date() > cached.expiresAt) return null;
    return cached;
  } catch (error) {
    logger.error("Read weather cache failed", error);
    return null;
  }
}

function cacheRowToWeatherData(row) {
  return {
    condition: row.condition,
    label: row.label,
    temperature: row.temperature,
    feelsLike: row.feelsLike,
    humidity: row.humidity,
    cloudCover: row.cloudCover,
    windSpeed: row.windSpeed,
    visibility: row.visibility,
    description: row.description,
    cityName: row.cityName,
    countryCode: row.countryCode,
    sunrise: row.sunrise,
    sunset: row.sunset,
    isMock: false,
    fromCache: true,
  };
}

async function upsertWeatherCache(latRounded, lonRounded, data) {
  const fetchedAt = new Date();
  const expiresAt = new Date(fetchedAt.getTime() + CACHE_TTL_MIN * 60 * 1000);

  try {
    await prisma.weatherCache.upsert({
      where: { latRounded_lonRounded: { latRounded, lonRounded } },
      update: buildWeatherCachePayload(data, { fetchedAt, expiresAt }),
      create: {
        latRounded,
        lonRounded,
        ...buildWeatherCachePayload(data, { fetchedAt, expiresAt }),
      },
    });
  } catch (error) {
    logger.error("Upsert weather cache failed", error);
  }
}

function buildWeatherCachePayload(data, { fetchedAt, expiresAt }) {
  return {
    condition: data.condition,
    label: data.label,
    temperature: data.temperature,
    feelsLike: data.feelsLike ?? null,
    humidity: data.humidity,
    cloudCover: data.cloudCover,
    windSpeed: data.windSpeed,
    visibility: data.visibility,
    description: data.description ?? null,
    cityName: data.cityName ?? null,
    countryCode: data.countryCode ?? null,
    sunrise: data.sunrise ?? null,
    sunset: data.sunset ?? null,
    fetchedAt,
    expiresAt,
  };
}
