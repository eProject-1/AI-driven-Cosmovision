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
import groq from "../../config/groq.js";
import { AppError } from "../../utils/AppError.js";

import { getWeatherByCoords, roundCoord } from "../../services/external/weather.service.js";
import { getApod, getNearEarthObjects } from "../../services/external/nasa.service.js";
import { reverseGeocode, calculateDistance } from "../../services/external/maps.service.js";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

// Cache TTL cho cả recommendation (không chỉ weather) — theo quyết định dự án
const RECOMMENDATION_CACHE_TTL_MIN = parseInt(process.env.RECOMMENDATION_CACHE_TTL_MINUTES || "30");

// Dưới ngưỡng này thì không đáng gọi Groq — trả rule-based để tiết kiệm token
const SKY_SCORE_AI_THRESHOLD = parseInt(process.env.SKY_SCORE_AI_THRESHOLD || "40");

// Bán kính tìm observatory quanh user (km)
const OBSERVATORY_SEARCH_RADIUS_KM = parseInt(process.env.OBSERVATORY_SEARCH_RADIUS_KM || "150");

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

// ─── Visible Planets (từ DB) ───────────────────────────────────────────────────

async function getVisiblePlanets() {
  return prisma.planet.findMany({
    where: { isVisible: true, NOT: { slug: "earth" } },
    select: {
      name: true,
      slug: true,
      type: true,
      distanceFromSunAu: true,
      hasRings: true,
      numberOfMoons: true,
    },
    orderBy: { distanceFromSunAu: "asc" },
    take: 5,
  });
}

// ─── Visible Constellations (rule-based theo tháng) ───────────────────────────

const MONTHLY_CONSTELLATIONS = {
  1:  ["Orion", "Taurus", "Gemini"],
  2:  ["Orion", "Canis Major", "Gemini"],
  3:  ["Leo", "Virgo", "Cancer"],
  4:  ["Leo", "Virgo", "Hydra"],
  5:  ["Virgo", "Scorpius", "Bootes"],
  6:  ["Scorpius", "Sagittarius", "Hercules"],
  7:  ["Scorpius", "Sagittarius", "Lyra"],
  8:  ["Sagittarius", "Aquila", "Cygnus"],
  9:  ["Aquarius", "Pisces", "Pegasus"],
  10: ["Pegasus", "Andromeda", "Perseus"],
  11: ["Andromeda", "Perseus", "Aries"],
  12: ["Orion", "Taurus", "Perseus"],
};

function getVisibleConstellations() {
  const month = new Date().getMonth() + 1;
  return MONTHLY_CONSTELLATIONS[month] || ["Orion", "Ursa Major"];
}

// ─── Observatory gần user (DB, KHÔNG gọi Overpass) ────────────────────────────

/**
 * Tìm đài quan sát gần tọa độ user, dùng dữ liệu DB tự quản lý
 * (model Observatory đã có lightPollutionScore/skyQualityScore sẵn).
 *
 * Lý do thay Overpass:
 *  - Overpass phụ thuộc dữ liệu cộng đồng OSM — nhiều khu vực VN không có tag
 *    man_made=observatory nên trả về rỗng, không đáng tin cho production.
 *  - DB tự quản lý cho phép admin nhập tay các điểm "vùng tối" (dark sky spots)
 *    thực tế dù không phải đài thiên văn chính thức (VD: Ba Vì, Tam Đảo).
 *  - Không rate-limit, không phụ thuộc bên thứ 3, không cần network call thêm.
 *
 * Dùng bounding-box thô để giảm số dòng cần tính Haversine, sau đó lọc chính xác.
 */
async function getNearbyObservatories(lat, lon, radiusKm = OBSERVATORY_SEARCH_RADIUS_KM) {
  // ~1 độ vĩ độ ≈ 111km — tính bounding box thô để query nhanh trước khi lọc chính xác
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);

  const candidates = await prisma.observatory.findMany({
    where: {
      isPublic: true,
      latitude:  { gte: lat - latDelta, lte: lat + latDelta },
      longitude: { gte: lon - lonDelta, lte: lon + lonDelta },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      lightPollutionScore: true,
      skyQualityScore: true,
      rating: true,
      isFeatured: true,
    },
    take: 30, // giới hạn ứng viên trước khi lọc Haversine chính xác
  });

  return candidates
    .map((obs) => ({
      ...obs,
      distanceKm: calculateDistance({ lat, lon }, { lat: obs.latitude, lon: obs.longitude }),
    }))
    .filter((obs) => obs.distanceKm <= radiusKm)
    .sort((a, b) => {
      // Ưu tiên: featured trước, rồi tới skyQualityScore cao, rồi tới gần nhất
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      const scoreDiff = (b.skyQualityScore ?? 0) - (a.skyQualityScore ?? 0);
      if (Math.abs(scoreDiff) > 5) return scoreDiff;
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, 3);
}

// ─── NASA NEO/APOD ẢNH HƯỞNG LOGIC (không chỉ nhét vào prompt) ────────────────

/**
 * Quyết định "sự kiện đặc biệt" từ dữ liệu NASA thật, dùng để:
 *  - Chèn thêm vào visiblePlanets/sự kiện nếu liên quan
 *  - Đánh dấu mức độ ưu tiên cho prompt AI (thay vì chỉ liệt kê thụ động)
 *
 * Quy tắc:
 *  1. Nếu có NEO "potentially hazardous" và missDistance < 5 triệu km
 *     → đây là sự kiện đáng chú ý, ưu tiên cao nhất trong gợi ý.
 *  2. Nếu APOD title trùng tên 1 hành tinh đang có trong danh sách visible
 *     → đẩy hành tinh đó lên đầu danh sách (vì NASA đang "hot" về nó hôm nay).
 */
function deriveNasaInfluence({ apod, neoList, planets }) {
  const influence = {
    priorityEvent: null,       // sự kiện ưu tiên cao nhất (asteroid gần, nếu có)
    boostedPlanetSlug: null,   // hành tinh được đẩy lên đầu do trùng APOD
    reorderedPlanets: planets, // danh sách hành tinh sau khi áp dụng influence
  };

  // Quy tắc 1: NEO nguy hiểm + khoảng cách gần → priority event
  if (Array.isArray(neoList) && neoList.length > 0) {
    const closeHazard = neoList
      .filter((n) => n.isPotentiallyHazardous && n.missDistanceKm != null)
      .sort((a, b) => a.missDistanceKm - b.missDistanceKm)[0];

    if (closeHazard && closeHazard.missDistanceKm < 5_000_000) {
      influence.priorityEvent = {
        type: "NEAR_EARTH_ASTEROID",
        name: closeHazard.name,
        missDistanceKm: Math.round(closeHazard.missDistanceKm),
        isPotentiallyHazardous: true,
      };
    } else if (neoList.length > 0) {
      // Không nguy hiểm nhưng vẫn là tin đáng nói nếu khoảng cách gần nhất < 1 triệu km
      const nearest = [...neoList].sort(
        (a, b) => (a.missDistanceKm ?? Infinity) - (b.missDistanceKm ?? Infinity)
      )[0];
      if (nearest?.missDistanceKm != null && nearest.missDistanceKm < 1_000_000) {
        influence.priorityEvent = {
          type: "NEAR_EARTH_ASTEROID",
          name: nearest.name,
          missDistanceKm: Math.round(nearest.missDistanceKm),
          isPotentiallyHazardous: false,
        };
      }
    }
  }

  // Quy tắc 2: APOD trùng tên hành tinh → đẩy hành tinh đó lên đầu danh sách
  if (apod?.title && Array.isArray(planets) && planets.length > 0) {
    const apodTitleLower = apod.title.toLowerCase();
    const matchedIndex = planets.findIndex((p) =>
      apodTitleLower.includes(p.name.toLowerCase())
    );

    if (matchedIndex > 0) {
      const reordered = [...planets];
      const [matched] = reordered.splice(matchedIndex, 1);
      reordered.unshift(matched);
      influence.boostedPlanetSlug = matched.slug;
      influence.reorderedPlanets = reordered;
    } else if (matchedIndex === 0) {
      influence.boostedPlanetSlug = planets[0].slug;
    }
  }

  return influence;
}

// ─── Rule-based suggestion (KHÔNG gọi Groq) ───────────────────────────────────

/**
 * Sinh gợi ý hoàn toàn rule-based — dùng khi skyScore quá thấp để tiết kiệm token Groq,
 * hoặc khi Groq lỗi (fallback).
 */
function buildRuleBasedSuggestion({ locationLabel, skyScore, tier, planets, constellations, nasaInfluence }) {
  const firstPlanet = planets[0]?.name || "các hành tinh";
  const firstConstellation = constellations[0];

  const nasaNote = nasaInfluence.priorityEvent
    ? ` NASA cũng ghi nhận tiểu hành tinh ${nasaInfluence.priorityEvent.name} đang tiếp cận Trái Đất.`
    : "";

  if (tier.tier === "POOR") {
    return `Điều kiện quan sát tại ${locationLabel} hôm nay không thuận lợi (điểm ${skyScore}/100 - ${tier.label}). Mây dày hoặc độ ẩm cao có thể che khuất bầu trời. Bạn có thể thử ứng dụng Stellarium để mô phỏng bầu trời, hoặc lên kế hoạch cho đêm trời quang hơn.${nasaNote}`;
  }
  if (tier.tier === "BELOW_FAIR") {
    return `Bầu trời ${locationLabel} hôm nay ở mức ${tier.label.toLowerCase()} (điểm ${skyScore}/100). Vẫn có thể thử quan sát ${firstPlanet} nếu tìm được điểm ít mây, nhưng đừng kỳ vọng quá cao.${nasaNote}`;
  }
  if (tier.tier === "FAIR") {
    return `Bầu trời ${locationLabel} hôm nay ở mức trung bình (điểm ${skyScore}/100). Bạn vẫn có thể thấy ${firstPlanet} nếu tìm điểm ít mây. Chòm sao ${firstConstellation} cũng đáng thử.${nasaNote}`;
  }
  // GOOD / EXCELLENT
  return `Tối nay bầu trời ${locationLabel} khá quang đãng (điểm ${skyScore}/100 - ${tier.label}) - điều kiện lý tưởng để quan sát! Hãy để ý ${firstPlanet} và chòm sao ${firstConstellation}. Thời điểm tốt nhất là sau khi trời tối hẳn.${nasaNote}`;
}

// ─── Groq AI Suggestion ───────────────────────────────────────────────────────

async function generateAiSuggestion({
  locationInfo,
  weather,
  skyScore,
  tier,
  planets,
  constellations,
  apod,
  nearbyNeo,
  nasaInfluence,
  observatories,
}) {
  const locationLabel =
    locationInfo?.city
      ? `${locationInfo.city}${locationInfo.country ? ", " + locationInfo.country : ""}`
      : locationInfo?.displayName || "vi tri cua ban";

  const planetList = planets
    .map((p) => {
      const tags = [];
      if (p.hasRings) tags.push("co vanh dai");
      if (p.numberOfMoons) tags.push(`${p.numberOfMoons} mat trang`);
      const boosted = nasaInfluence.boostedPlanetSlug === p.slug ? " [NASA dang chu y hom nay]" : "";
      return tags.length > 0 ? `${p.name}${boosted} (${tags.join(", ")})` : `${p.name}${boosted}`;
    })
    .join(", ");

  const neoInfo = nasaInfluence.priorityEvent
    ? `${nasaInfluence.priorityEvent.name} (cach Trai Dat ${Math.round(nasaInfluence.priorityEvent.missDistanceKm / 1000)} nghin km${nasaInfluence.priorityEvent.isPotentiallyHazardous ? ", duoc theo doi do tiep can gan" : ""})`
    : null;

  const apodInfo = apod ? `Anh thien van NASA hom nay: "${apod.title}"` : null;

  const observatoryInfo =
    observatories && observatories.length > 0
      ? observatories.map((o) => `${o.name} (${o.distanceKm}km, ${o.city || o.country})`).join("; ")
      : null;

  const sunsetStr = weather.sunset instanceof Date
    ? weather.sunset.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : null;

  const prompt = `Ban la CosmoBot, tro ly thien van cua CosmoVision. Hay tao mot goi y quan sat bau troi ngan gon, than thien va thuc te (4-6 cau) cho nguoi dung tai ${locationLabel}.

DU LIEU THUC TE HOM NAY:
- Thoi tiet: ${weather.label || weather.condition}, ${weather.temperature}°C, do am ${weather.humidity}%
- Do phu may: ${weather.cloudCover}%, tam nhin: ${weather.visibility} km, gio: ${weather.windSpeed} km/h
- Diem quan sat bau troi: ${skyScore}/100 (${tier.label})
${sunsetStr ? `- Hoang hon luc: ${sunsetStr}` : ""}
${apodInfo ? `- ${apodInfo}` : ""}
${neoInfo ? `- SU KIEN UU TIEN (NASA): ${neoInfo}` : ""}
${observatoryInfo ? `- Dia diem quan sat gan day: ${observatoryInfo}` : ""}

DOI TUONG CO THE QUAN SAT (da sap xep theo do uu tien tu du lieu NASA):
- Hanh tinh: ${planetList || "khong co thong tin"}
- Chom sao thang nay: ${constellations.join(", ")}

YEU CAU:
- Tra loi BANG TIENG VIET.
- Neu co [NASA dang chu y hom nay] o hanh tinh nao, UU TIEN nhac den hanh tinh do dau tien.
- Neu co SU KIEN UU TIEN (NASA), nhac den ro rang vi day la tin dang chu y nhat hom nay.
- Neu co dia diem quan sat gan day, goi y 1 dia diem cu the.
- Giu duoi 120 tu, giong van than thien va truyen cam hung.`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "Ban la CosmoBot, tro ly thien van cua CosmoVision. Luon tra loi bang tieng Viet, ngan gon va truyen cam hung.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.75,
      max_tokens: 350,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("[recommendation] Groq suggestion error:", error.message);
    return buildRuleBasedSuggestion({ locationLabel, skyScore, tier, planets, constellations, nasaInfluence });
  }
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
  return prisma.recommendation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 50),
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

