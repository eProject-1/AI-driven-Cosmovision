/**
 * weather.service.js (v2 — DB cache, production-ready)
 * Flow:
 *  1. Làm tròn tọa độ → tạo cache key
 *  2. Kiểm tra WeatherCache trong DB còn hạn (expiresAt > now)
 *  3. Nếu có → trả cache ngay, không gọi OWM
 *  4. Nếu hết hạn / chưa có → gọi OWM → upsert vào DB → trả kết quả
 */

import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

const OWM_BASE_URL     = "https://api.openweathermap.org/data/2.5";
const API_KEY          = process.env.OPENWEATHER_API_KEY;
const CACHE_TTL_MIN    = parseInt(process.env.WEATHER_CACHE_TTL_MINUTES || "30");
const FETCH_TIMEOUT_MS = 8000;

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, ms = FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// Làm tròn tọa độ 2 chữ số (~1.1 km) → cache key. Export để recommendation.service dùng chung key.
export function roundCoord(val) {
  return Math.round(val * 100) / 100;
}

function mapOwmCondition(weatherArr = []) {
  if (!weatherArr.length) return { condition: "clear", label: "Quang đãng" };
  const id = weatherArr[0].id;
  if (id >= 200 && id < 300) return { condition: "rainy",         label: "Dông/sấm chớp" };
  if (id >= 300 && id < 400) return { condition: "rainy",         label: "Mưa phùn" };
  if (id >= 500 && id < 600) return { condition: "rainy",         label: "Mưa" };
  if (id >= 600 && id < 700) return { condition: "cloudy",        label: "Tuyết" };
  if (id >= 700 && id < 800) return { condition: "foggy",         label: "Sương mù/khói bụi" };
  if (id === 800)             return { condition: "clear",         label: "Quang đãng" };
  if (id === 801)             return { condition: "partly_cloudy", label: "Ít mây" };
  if (id >= 802)              return { condition: "cloudy",        label: "Nhiều mây" };
  return { condition: "clear", label: "Quang đãng" };
}

function getMockWeather(lat, lon) {
  console.warn("[weather.service] Dùng mock — chưa có OPENWEATHER_API_KEY.");
  return {
    condition: "clear", label: "Quang đãng (mock)",
    temperature: 25, feelsLike: 27, humidity: 60,
    cloudCover: 10, windSpeed: 5, visibility: 10,
    description: "clear sky", cityName: null, countryCode: null,
    sunrise: null, sunset: null, isMock: true, lat, lon,
  };
}

// ─── DB cache helpers ──────────────────────────────────────────────────────────

async function getCachedWeather(latR, lonR) {
  try {
    const cached = await prisma.weatherCache.findUnique({
      where: { latRounded_lonRounded: { latRounded: latR, lonRounded: lonR } },
    });
    if (!cached) return null;
    if (new Date() > cached.expiresAt) return null; // hết hạn
    return cached;
  } catch (err) {
    console.error("[weather.service] Lỗi đọc cache:", err.message);
    return null; // DB lỗi → bỏ qua cache, gọi API trực tiếp
  }
}

function cacheRowToWeatherData(row) {
  return {
    condition:   row.condition,
    label:       row.label,
    temperature: row.temperature,
    feelsLike:   row.feelsLike,
    humidity:    row.humidity,
    cloudCover:  row.cloudCover,
    windSpeed:   row.windSpeed,
    visibility:  row.visibility,
    description: row.description,
    cityName:    row.cityName,
    countryCode: row.countryCode,
    sunrise:     row.sunrise,
    sunset:      row.sunset,
    isMock:      false,
    fromCache:   true,
  };
}

async function upsertWeatherCache(latR, lonR, data) {
  const fetchedAt = new Date();
  const expiresAt = new Date(fetchedAt.getTime() + CACHE_TTL_MIN * 60 * 1000);

  try {
    await prisma.weatherCache.upsert({
      where: { latRounded_lonRounded: { latRounded: latR, lonRounded: lonR } },
      update: {
        condition: data.condition, label: data.label,
        temperature: data.temperature, feelsLike: data.feelsLike ?? null,
        humidity: data.humidity, cloudCover: data.cloudCover,
        windSpeed: data.windSpeed, visibility: data.visibility,
        description: data.description ?? null,
        cityName: data.cityName ?? null, countryCode: data.countryCode ?? null,
        sunrise: data.sunrise ?? null, sunset: data.sunset ?? null,
        fetchedAt, expiresAt,
      },
      create: {
        latRounded: latR, lonRounded: lonR,
        condition: data.condition, label: data.label,
        temperature: data.temperature, feelsLike: data.feelsLike ?? null,
        humidity: data.humidity, cloudCover: data.cloudCover,
        windSpeed: data.windSpeed, visibility: data.visibility,
        description: data.description ?? null,
        cityName: data.cityName ?? null, countryCode: data.countryCode ?? null,
        sunrise: data.sunrise ?? null, sunset: data.sunset ?? null,
        fetchedAt, expiresAt,
      },
    });
  } catch (err) {
    console.error("[weather.service] Lỗi upsert cache:", err.message);
    // Không throw — cache fail không được làm hỏng flow chính
  }
}

/**
 * Dọn cache hết hạn. Gọi định kỳ bằng cron job riêng (không block request chính),
 * hoặc gọi lazy mỗi N request từ recommendation.service nếu chưa setup cron.
 */
export async function cleanupExpiredWeatherCache() {
  try {
    const result = await prisma.weatherCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      console.log(`[weather.service] Đã dọn ${result.count} cache hết hạn.`);
    }
    return result.count;
  } catch (err) {
    console.error("[weather.service] Lỗi dọn cache:", err.message);
    return 0;
  }
}

// ─── Core export ───────────────────────────────────────────────────────────────

/**
 * Lấy thời tiết hiện tại theo tọa độ.
 * Ưu tiên: DB cache (TTL 30 phút) → OWM API → mock fallback
 */
export async function getWeatherByCoords(lat, lon) {
  const latR = roundCoord(lat);
  const lonR = roundCoord(lon);

  // 1. Kiểm tra cache DB
  const cached = await getCachedWeather(latR, lonR);
  if (cached) {
    return cacheRowToWeatherData(cached);
  }

  // 2. Chưa có key → mock
  if (!API_KEY) return getMockWeather(lat, lon);

  // 3. Gọi OWM
  const url = `${OWM_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=vi`;
  let res;
  try {
    res = await fetchWithTimeout(url);
  } catch {
    console.error("[weather.service] OWM timeout.");
    return getMockWeather(lat, lon);
  }

  if (!res.ok) {
    if (res.status === 401) {
      console.error("[weather.service] API key chưa kích hoạt hoặc sai.");
      return getMockWeather(lat, lon);
    }
    const body = await res.json().catch(() => ({}));
    throw new AppError(`OpenWeatherMap lỗi: ${body?.message || res.status}`, 502);
  }

  const d = await res.json();
  const { condition, label } = mapOwmCondition(d.weather);

  const result = {
    condition, label,
    temperature:  Math.round(d.main.temp),
    feelsLike:    Math.round(d.main.feels_like),
    humidity:     d.main.humidity,
    cloudCover:   d.clouds?.all ?? 0,
    windSpeed:    Math.round((d.wind?.speed ?? 0) * 3.6),
    visibility:   Math.round((d.visibility ?? 10000) / 1000),
    description:  d.weather[0]?.description ?? "",
    cityName:     d.name || null,
    countryCode:  d.sys?.country || null,
    sunrise:      d.sys?.sunrise ? new Date(d.sys.sunrise * 1000) : null,
    sunset:       d.sys?.sunset  ? new Date(d.sys.sunset  * 1000) : null,
    isMock:       false,
    fromCache:    false,
  };

  // 4. Lưu vào cache DB — KHÔNG await để không block response chính
  upsertWeatherCache(latR, lonR, result);

  return result;
}

export function getWeatherConditionLabel(condition) {
  const map = {
    clear: "Quang đãng", partly_cloudy: "Ít mây",
    cloudy: "Nhiều mây", rainy: "Mưa", foggy: "Sương mù",
  };
  return map[condition] ?? "Không xác định";
}

export const getCurrentWeatherByCoordinates = getWeatherByCoords;