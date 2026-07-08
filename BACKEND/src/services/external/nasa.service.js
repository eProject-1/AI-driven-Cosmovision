/**
 * nasa.service.js
 * Export:
 *   getApod(date?)              → Ảnh thiên văn trong ngày (APOD)
 *   getApodRange(start, end)    → Danh sách APOD theo khoảng ngày
 *   getNearEarthObjects(date?)  → Tiểu hành tinh gần Trái Đất (NeoWs)
 *   getMarsRoverPhotos(options) → Ảnh từ tàu thám hiểm Mars
 */

import { AppError } from "../../utils/app-error.util.js";

// ─── Config ────────────────────────────────────────────────────────────────────

const NASA_BASE_URL = "https://api.nasa.gov";
const API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";
const FETCH_TIMEOUT_MS = 10000;

// ─── Helper ────────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gọi NASA API, tự append api_key vào URL.
 * Trả về JSON đã parse hoặc throw AppError.
 */
async function nasaFetch(endpoint, params = {}) {
  const searchParams = new URLSearchParams({ ...params, api_key: API_KEY });
  const url = `${NASA_BASE_URL}${endpoint}?${searchParams.toString()}`;

  let res;
  try {
    res = await fetchWithTimeout(url);
  } catch (err) {
    throw new AppError(`NASA API timeout hoặc mất kết nối: ${err.message}`, 503);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || body?.msg || `HTTP ${res.status}`;
    throw new AppError(`NASA API lỗi: ${msg}`, 502);
  }

  return res.json();
}

/**
 * Format ngày thành YYYY-MM-DD (NASA yêu cầu )
 */
function toNasaDate(date = new Date()) {
  return date instanceof Date
    ? date.toISOString().split("T")[0]
    : String(date);
}

// ─── APOD — Astronomy Picture of the Day ──────────────────────────────────────

/**
 * Lấy ảnh thiên văn trong ngày (hoặc theo ngày cụ thể).
 * Dùng cho: module News, Dashboard widget.
 *
 * @param {string|Date} [date]  - Ngày muốn lấy, mặc định = hôm nay
 * @returns {Promise<ApodItem>}
 *
 * ApodItem shape:
 * {
 *   date:        string   "YYYY-MM-DD"
 *   title:       string
 *   explanation: string   mô tả khoa học (tiếng Anh)
 *   url:         string   URL ảnh hoặc video
 *   hdurl:       string | undefined
 *   mediaType:   "image" | "video"
 *   copyright:   string | undefined
 *   serviceVersion: string
 * }
 */
export async function getApod(date) {
  const params = date ? { date: toNasaDate(date) } : {};
  const data = await nasaFetch("/planetary/apod", params);

  return {
    date:           data.date,
    title:          data.title,
    explanation:    data.explanation,
    url:            data.url,
    hdurl:          data.hdurl,
    mediaType:      data.media_type,
    copyright:      data.copyright,
    serviceVersion: data.service_version,
  };
}

/**
 * Lấy nhiều APOD theo khoảng ngày.
 * Dùng cho: trang News — danh sách ảnh tuần này.
 *
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {Promise<ApodItem[]>}  mảng sắp xếp mới nhất trước
 */
export async function getApodRange(startDate, endDate = new Date()) {
  const data = await nasaFetch("/planetary/apod", {
    start_date: toNasaDate(startDate),
    end_date:   toNasaDate(endDate),
  });

  const items = Array.isArray(data) ? data : [data];

  return items
    .map((d) => ({
      date:        d.date,
      title:       d.title,
      explanation: d.explanation,
      url:         d.url,
      hdurl:       d.hdurl,
      mediaType:   d.media_type,
      copyright:   d.copyright,
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // mới nhất trước
}

// ─── NeoWs — Near Earth Objects ───────────────────────────────────────────────

/**
 * Lấy danh sách tiểu hành tinh gần Trái Đất trong ngày.
 * Dùng cho: Dashboard widget "Sự kiện vũ trụ", News module.
 *
 * @param {string|Date} [date]  - Ngày cần tra, mặc định = hôm nay
 * @returns {Promise<NeoItem[]>}
 *
 * NeoItem shape:
 * {
 *   id:               string
 *   name:             string
 *   nasaJplUrl:       string
 *   isPotentiallyHazardous: boolean
 *   estimatedDiameterMinKm: number
 *   estimatedDiameterMaxKm: number
 *   closestApproachDate:    string
 *   missDistanceKm:         number
 *   relativeVelocityKmh:    number
 * }
 */
export async function getNearEarthObjects(date) {
  const dateStr = toNasaDate(date || new Date());

  const data = await nasaFetch("/neo/rest/v1/feed", {
    start_date: dateStr,
    end_date:   dateStr,
  });

  const neoList = data.near_earth_objects?.[dateStr] ?? [];

  return neoList
    .map((neo) => {
      const approach = neo.close_approach_data?.[0] ?? {};
      const diameter = neo.estimated_diameter?.kilometers ?? {};

      return {
        id:                       neo.id,
        name:                     neo.name,
        nasaJplUrl:               neo.nasa_jpl_url,
        isPotentiallyHazardous:   neo.is_potentially_hazardous_asteroid,
        estimatedDiameterMinKm:   diameter.estimated_diameter_min ?? null,
        estimatedDiameterMaxKm:   diameter.estimated_diameter_max ?? null,
        closestApproachDate:      approach.close_approach_date ?? dateStr,
        missDistanceKm:           approach.miss_distance?.kilometers
                                    ? parseFloat(approach.miss_distance.kilometers)
                                    : null,
        relativeVelocityKmh:      approach.relative_velocity?.kilometers_per_hour
                                    ? parseFloat(approach.relative_velocity.kilometers_per_hour)
                                    : null,
      };
    })
    .sort((a, b) => (a.missDistanceKm ?? Infinity) - (b.missDistanceKm ?? Infinity)); // gần nhất trước
}

// ─── Mars Rover Photos ─────────────────────────────────────────────────────────

/**
 * Lấy ảnh từ tàu thám hiểm sao Hỏa (mặc định: Curiosity).
 * Dùng cho: trang Planets → chi tiết sao Hỏa, hoặc News.
 *
 * @param {object} options
 * @param {"curiosity"|"opportunity"|"spirit"|"perseverance"} [options.rover]
 * @param {number} [options.sol]         - Ngày sao Hỏa (sol), mặc định = 1000
 * @param {string} [options.earthDate]   - Ngày Trái Đất "YYYY-MM-DD" (ưu tiên hơn sol)
 * @param {number} [options.page]        - Trang kết quả (mỗi trang 25 ảnh)
 * @returns {Promise<MarsPhoto[]>}
 *
 * MarsPhoto shape:
 * {
 *   id:          number
 *   sol:         number
 *   earthDate:   string
 *   imgSrc:      string   URL ảnh
 *   camera:      { name: string, fullName: string }
 *   rover:       { name: string, status: string }
 * }
 */
export async function getNearEarthObjectsRange(startDate = new Date(), endDate = new Date()) {
  const startStr = toNasaDate(startDate);
  const endStr = toNasaDate(endDate);

  const data = await nasaFetch("/neo/rest/v1/feed", {
    start_date: startStr,
    end_date: endStr,
  });

  const grouped = data.near_earth_objects ?? {};

  return Object.entries(grouped)
    .flatMap(([dateStr, neoList]) =>
      (neoList || []).map((neo) => {
        const approach = neo.close_approach_data?.[0] ?? {};
        const diameter = neo.estimated_diameter?.kilometers ?? {};

        return {
          id:                       neo.id,
          name:                     neo.name,
          nasaJplUrl:               neo.nasa_jpl_url,
          isPotentiallyHazardous:   neo.is_potentially_hazardous_asteroid,
          estimatedDiameterMinKm:   diameter.estimated_diameter_min ?? null,
          estimatedDiameterMaxKm:   diameter.estimated_diameter_max ?? null,
          closestApproachDate:      approach.close_approach_date ?? dateStr,
          missDistanceKm:           approach.miss_distance?.kilometers
                                      ? parseFloat(approach.miss_distance.kilometers)
                                      : null,
          relativeVelocityKmh:      approach.relative_velocity?.kilometers_per_hour
                                      ? parseFloat(approach.relative_velocity.kilometers_per_hour)
                                      : null,
        };
      })
    )
    .sort((a, b) => {
      const dateCompare = String(a.closestApproachDate).localeCompare(String(b.closestApproachDate));
      if (dateCompare !== 0) return dateCompare;
      return (a.missDistanceKm ?? Infinity) - (b.missDistanceKm ?? Infinity);
    });
}

export async function getMarsRoverPhotos({
  rover     = "curiosity",
  sol,
  earthDate,
  page      = 1,
} = {}) {
  const params = { page };

  if (earthDate) {
    params.earth_date = toNasaDate(earthDate);
  } else {
    params.sol = sol ?? 1000;
  }

  const data = await nasaFetch(`/mars-photos/api/v1/rovers/${rover}/photos`, params);

  const photos = data.photos ?? [];

  return photos.map((p) => ({
    id:        p.id,
    sol:       p.sol,
    earthDate: p.earth_date,
    imgSrc:    p.img_src,
    camera: {
      name:     p.camera?.name     ?? "",
      fullName: p.camera?.full_name ?? "",
    },
    rover: {
      name:   p.rover?.name   ?? rover,
      status: p.rover?.status ?? "",
    },
  }));
}
