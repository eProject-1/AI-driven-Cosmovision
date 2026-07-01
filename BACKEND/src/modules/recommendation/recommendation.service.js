/**
 * recommendation.service.js (v3 — production-ready)
 *
 * Cải tiến so với v2:
 *   1. Cache tầng Recommendation (TTL 30 phút theo locationKey) → tránh gọi lại
 *      toàn bộ pipeline (Weather/NASA/Maps/Groq) khi user bấm lại trong thời gian ngắn.
 *   2. Sky score phân tầng rõ ràng (Excellent/Good/Fair/Poor). Khi Poor (<40)
 *      → KHÔNG gọi Groq, dùng rule-based suggestion → tiết kiệm token.
 *   3. NASA NEO/APOD không chỉ nhét text vào prompt — chúng THỰC SỰ ảnh hưởng
 *      tới danh sách visiblePlanets / sự kiện được đề xuất.
 *   4. Observatory lấy từ DB (model Observatory đã có sẵn lightPollutionScore,
 *      skyQualityScore) thay vì gọi Overpass API ngoài — nhanh hơn, đáng tin cậy hơn,
 *      không phụ thuộc rate-limit của bên thứ 3.
 *
 * Flow gọi song song (Promise.allSettled, an toàn nếu 1 nguồn lỗi):
 *   [weather.service]     → thời tiết thực tế (đã có cache riêng 30')
 *   [maps.service]        → tên địa điểm thực tế (reverse geocode)
 *   [nasa.service]        → APOD hôm nay + tiểu hành tinh gần Trái Đất
 *   [prisma.planet]       → hành tinh visible từ DB
 *   [prisma.observatory]  → đài quan sát gần tọa độ user (DB, không gọi ngoài)
 *   [rule-based]          → chòm sao theo tháng
 *   [groq] (có điều kiện) → AI suggestion — CHỈ gọi khi skyScore >= ngưỡng
 *   [prisma]              → lưu kết quả + cache key vào DB
 */

import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

import { getWeatherByCoords, roundCoord } from "../../services/external/weather.service.js";
import { getApod, getNearEarthObjects } from "../../services/external/nasa.service.js";
import { reverseGeocode } from "../../services/external/maps.service.js";
import { trackAnalyticsEvent } from "../../services/analytics/analytics.service.js";
import {
  deriveNasaInfluence,
  getNearbyObservatories,
  getVisibleConstellations,
  getVisiblePlanets,
} from "./recommendation-sources.service.js";
import {
  buildRuleBasedSuggestion,
  generateAiSuggestion,
} from "./recommendation-suggestion.service.js";

// Cache TTL cho cả recommendation (không chỉ weather) — theo quyết định dự án
const RECOMMENDATION_CACHE_TTL_MIN = parseInt(process.env.RECOMMENDATION_CACHE_TTL_MINUTES || "30");

// Dưới ngưỡng này thì không đáng gọi Groq — trả rule-based để tiết kiệm token
const SKY_SCORE_AI_THRESHOLD = parseInt(process.env.SKY_SCORE_AI_THRESHOLD || "40");

// Bán kính tìm observatory quanh user (km)
function clampLimit(value, fallback = 10, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

// ─── Sky Visibility Score ──────────────────────────────────────────────────────

/**
 * Tính điểm quan sát bầu trời (0–100) từ dữ liệu thời tiết thực tế.
 *
 * Trọng số:
 *  - Cloud cover (độ phủ mây): 40đ — yếu tố quan trọng nhất
 *  - Humidity (độ ẩm):         30đ — cao → hơi nước làm mờ ảnh
 *  - Visibility (tầm nhìn xa): 30đ — thấp → không khí bụi/sương
 */
function calculateSkyVisibilityScore(weather) {
  const { cloudCover = 50, humidity = 70, visibility = 5 } = weather;

  const cloudScore      = Math.round((1 - cloudCover / 100) * 40);
  const humidityScore   = Math.round(Math.max(0, 1 - humidity / 100) * 30);
  const visibilityScore = Math.round(Math.min(1, visibility / 20) * 30);

  return Math.min(100, cloudScore + humidityScore + visibilityScore);
}

/**
 * Phân tầng điểm số thành nhãn — dùng cho cả prompt AI lẫn rule-based fallback.
 */
function getSkyScoreTier(score) {
  if (score >= 90) return { tier: "EXCELLENT", label: "Rất tốt" };
  if (score >= 70) return { tier: "GOOD",      label: "Tốt" };
  if (score >= 50) return { tier: "FAIR",      label: "Trung bình" };
  if (score >= SKY_SCORE_AI_THRESHOLD) return { tier: "BELOW_FAIR", label: "Kém" };
  return { tier: "POOR", label: "Rất kém" };
}

// ─── Best Time Window ──────────────────────────────────────────────────────────

function calculateBestTimeWindow(skyScore, sunset = null) {
  let startHour;

  if (sunset instanceof Date) {
    startHour = sunset.getHours() + 1 + Math.round(sunset.getMinutes() / 60);
  } else {
    startHour = skyScore >= 70 ? 20 : skyScore >= 50 ? 21 : 22;
  }

  startHour = Math.min(startHour, 23);
  const endHour = startHour + 2;

  const base = new Date();
  base.setHours(0, 0, 0, 0);
  if (new Date().getHours() < 12) base.setDate(base.getDate() - 1);

  const bestTimeStart = new Date(base);
  bestTimeStart.setHours(startHour, 0, 0, 0);

  const bestTimeEnd = new Date(base);
  bestTimeEnd.setHours(endHour % 24, 0, 0, 0);
  if (endHour >= 24) bestTimeEnd.setDate(bestTimeEnd.getDate() + 1);

  return { bestTimeStart, bestTimeEnd };
}

// ─── Recommendation cache (tầng riêng, KHÔNG phải weather cache) ──────────────

function buildLocationKey(lat, lon) {
  return `${roundCoord(lat)}_${roundCoord(lon)}`;
}

/**
 * Tìm recommendation còn hạn (theo locationKey + userId) để tránh chạy lại
 * toàn bộ pipeline (4 API external + Groq) khi user request liên tục.
 */
async function getCachedRecommendation(userId, locationKey) {
  try {
    const cached = await prisma.recommendation.findFirst({
      where: {
        userId,
        locationKey,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    return cached;
  } catch (err) {
    console.error("[recommendation] Lỗi đọc cache recommendation:", err.message);
    return null;
  }
}

// ─── Exported Service Functions ───────────────────────────────────────────────

/**
 * Tạo gợi ý quan sát mới cho user — có cache tầng recommendation (TTL 30 phút).
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {string} [params.locationName]
 * @param {boolean} [params.forceRefresh] - bỏ qua cache, luôn tạo mới (dùng cho nút "Làm mới")
 */
export async function createRecommendation({ userId, latitude, longitude, locationName, forceRefresh = false }) {
  const locationKey = buildLocationKey(latitude, longitude);

  // Bước 0: Kiểm tra cache recommendation trước — tránh gọi lại toàn bộ pipeline
  if (!forceRefresh) {
    const cached = await getCachedRecommendation(userId, locationKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }

  // Bước 1: Gọi song song tất cả nguồn dữ liệu ngoài + DB
  const [weatherResult, locationResult, apodResult, neoResult, planetsResult, observatoryResult] =
    await Promise.allSettled([
      getWeatherByCoords(latitude, longitude),
      reverseGeocode(latitude, longitude),
      getApod(),
      getNearEarthObjects(),
      getVisiblePlanets(),
      getNearbyObservatories(latitude, longitude),
    ]);

  const weatherData = weatherResult.status === "fulfilled"
    ? weatherResult.value
    : { condition: "clear", label: "Không xác định", temperature: 25, humidity: 60, cloudCover: 10, windSpeed: 5, visibility: 10, isMock: true };
  const locationData  = locationResult.status     === "fulfilled" ? locationResult.value     : null;
  const apodData       = apodResult.status         === "fulfilled" ? apodResult.value         : null;
  const neoData         = neoResult.status          === "fulfilled" ? neoResult.value          : [];
  const planetsRaw       = planetsResult.status      === "fulfilled" ? planetsResult.value      : [];
  const observatories      = observatoryResult.status  === "fulfilled" ? observatoryResult.value   : [];

  if (weatherResult.status     === "rejected") console.error("[recommendation] Weather API lỗi:", weatherResult.reason?.message);
  if (locationResult.status    === "rejected") console.error("[recommendation] Geocoding lỗi:", locationResult.reason?.message);
  if (apodResult.status        === "rejected") console.error("[recommendation] NASA APOD lỗi:", apodResult.reason?.message);
  if (neoResult.status         === "rejected") console.error("[recommendation] NASA NEO lỗi:", neoResult.reason?.message);
  if (planetsResult.status     === "rejected") console.error("[recommendation] DB planets lỗi:", planetsResult.reason?.message);
  if (observatoryResult.status === "rejected") console.error("[recommendation] DB observatory lỗi:", observatoryResult.reason?.message);

  // Bước 2: NASA ảnh hưởng thực sự đến danh sách hành tinh / sự kiện ưu tiên
  const nasaInfluence = deriveNasaInfluence({ apod: apodData, neoList: neoData, planets: planetsRaw });
  const planets = nasaInfluence.reorderedPlanets;

  // Bước 3: Tính sky score + phân tầng
  const skyVisibilityScore = calculateSkyVisibilityScore(weatherData);
  const tier = getSkyScoreTier(skyVisibilityScore);
  const { bestTimeStart, bestTimeEnd } = calculateBestTimeWindow(skyVisibilityScore, weatherData.sunset);
  const constellations = getVisibleConstellations();
  const planetNames = planets.map((p) => p.name);

  const resolvedLocationName =
    locationName ||
    (locationData?.city
      ? `${locationData.city}${locationData.country ? ", " + locationData.country : ""}`
      : locationData?.displayName || null);

  // Bước 4: Sinh suggestion — CHỈ gọi Groq nếu skyScore đủ cao, tiết kiệm token khi trời quá xấu
  const aiSuggestion = skyVisibilityScore >= SKY_SCORE_AI_THRESHOLD
    ? await generateAiSuggestion({
        locationInfo: locationData,
        weather: weatherData,
        skyScore: skyVisibilityScore,
        tier,
        planets,
        constellations,
        apod: apodData,
        nearbyNeo: neoData,
        nasaInfluence,
        observatories,
      })
    : buildRuleBasedSuggestion({
        locationLabel: resolvedLocationName || "vị trí của bạn",
        skyScore: skyVisibilityScore,
        tier,
        planets,
        constellations,
        nasaInfluence,
      });

  // Bước 5: Lưu vào DB kèm cache key + TTL riêng cho recommendation
  const expiresAt = new Date(Date.now() + RECOMMENDATION_CACHE_TTL_MIN * 60 * 1000);

  const recommendation = await prisma.recommendation.create({
    data: {
      userId,
      latitude,
      longitude,
      locationKey,
      locationName: resolvedLocationName,
      weatherCondition: weatherData.condition,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      skyVisibilityScore,
      bestTimeStart,
      bestTimeEnd,
      visiblePlanets: planetNames,
      visibleConstellations: constellations,
      nearbyObservatories: observatories.map((o) => o.slug),
      aiSuggestion,
      expiresAt,
    },
  });

  // Bước 6: Trả về kết quả đầy đủ cho frontend
  trackAnalyticsEvent({
    userId,
    event: "RECOMMENDATION_REQUEST",
    entityType: "recommendation",
    entityId: recommendation.id,
    entityName: resolvedLocationName || locationKey,
    metadata: {
      skyVisibilityScore,
      weatherCondition: weatherData.condition,
      visiblePlanets: planetNames,
      visibleConstellations: constellations,
      observatoriesFound: observatories.length,
      aiGenerated: skyVisibilityScore >= SKY_SCORE_AI_THRESHOLD,
    },
  }).catch((error) => console.error("[analytics] recommendation track failed:", error.message));

  return {
    ...recommendation,
    fromCache: false,

    weatherDetail: {
      ...weatherData,
      label: weatherData.label || weatherData.condition,
    },
    locationDetail: locationData,
    skyScoreTier: tier,

    nasaApod: apodData
      ? { title: apodData.title, url: apodData.url, mediaType: apodData.mediaType }
      : null,
    nearEarthObjects: neoData.slice(0, 3).map((n) => ({
      name: n.name,
      isPotentiallyHazardous: n.isPotentiallyHazardous,
      missDistanceKm: n.missDistanceKm ? Math.round(n.missDistanceKm) : null,
    })),
    priorityNasaEvent: nasaInfluence.priorityEvent,

    nearbyObservatoryDetail: observatories,

    dataSourceInfo: {
      weatherIsMock: weatherData.isMock ?? false,
      geocodingAvailable: !!locationData,
      nasaApodAvailable: !!apodData,
      nasaNeoAvailable: neoData.length > 0,
      observatoriesFound: observatories.length,
      aiGenerated: skyVisibilityScore >= SKY_SCORE_AI_THRESHOLD,
    },
  };
}

/**
 * Lấy lịch sử recommendation của user.
 */
export async function getUserRecommendations(userId, { limit = 10 } = {}) {
  const safeLimit = clampLimit(limit);

  return prisma.recommendation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: safeLimit,
    select: {
      id: true,
      locationName: true,
      latitude: true,
      longitude: true,
      skyVisibilityScore: true,
      weatherCondition: true,
      temperature: true,
      bestTimeStart: true,
      bestTimeEnd: true,
      visiblePlanets: true,
      visibleConstellations: true,
      nearbyObservatories: true,
      aiSuggestion: true,
      createdAt: true,
    },
  });
}

/**
 * Lấy chi tiết một recommendation theo id. Chỉ owner mới xem được.
 */
export async function getRecommendationById(id, requestingUserId) {
  const recommendation = await prisma.recommendation.findUnique({ where: { id } });

  if (!recommendation) throw new AppError("Recommendation không tồn tại", 404);
  if (recommendation.userId !== requestingUserId) {
    throw new AppError("Bạn không có quyền xem recommendation này", 403);
  }

  return recommendation;
}

/**
 * Dọn các recommendation hết hạn — gọi định kỳ bằng cron job riêng.
 * (Recommendation hết hạn vẫn có giá trị lịch sử, nên chỉ xóa nếu muốn tiết kiệm
 * dung lượng DB; mặc định KHÔNG tự động xóa, chỉ cung cấp hàm để admin/cron gọi khi cần.)
 */
export async function cleanupExpiredRecommendationCache() {
  try {
    const result = await prisma.recommendation.updateMany({
      where: { expiresAt: { lt: new Date() } },
      data: {}, // no-op: giữ lại lịch sử, KHÔNG xóa — chỉ minh hoạ điểm mở rộng
    });
    return result.count;
  } catch (err) {
    console.error("[recommendation] Lỗi cleanup:", err.message);
    return 0;
  }
}

