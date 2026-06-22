/**
 * maps.service.js
 * Dịch vụ bản đồ & địa lý — dùng Nominatim (OpenStreetMap).
 * Docs: https://nominatim.org/release-docs/develop/api/Overview/
 * Export:
 *   reverseGeocode(lat, lon)           → Tên địa điểm từ tọa độ
 *   geocode(query)                     → Tọa độ từ tên địa điểm
 *   findNearbyObservatories(lat, lon)  → Đài thiên văn gần đó
 *   calculateDistance(coord1, coord2)  → Khoảng cách km (Haversine)
 */

import { AppError } from "../../utils/AppError.js";

// ─── Config ────────────────────────────────────────────────────────────────────

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// User-Agent BẮT BUỘC theo policy của Nominatim
const USER_AGENT = "CosmoVision-AI/1.0 (astronomy-portal; contact@cosmovision.edu.vn)";

const FETCH_TIMEOUT_MS = 8000;

// ─── Helper ────────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "vi,en",
        ...(options.headers ?? {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function nominatimFetch(endpoint, params = {}) {
  const searchParams = new URLSearchParams({ ...params, format: "json" });
  const url = `${NOMINATIM_BASE}${endpoint}?${searchParams.toString()}`;

  let res;
  try {
    res = await fetchWithTimeout(url);
  } catch (err) {
    throw new AppError(`Nominatim timeout hoặc mất kết nối: ${err.message}`, 503);
  }

  if (!res.ok) {
    throw new AppError(`Nominatim API lỗi: HTTP ${res.status}`, 502);
  }

  return res.json();
}

// ─── Reverse Geocoding ─────────────────────────────────────────────────────────

/**
 * Lấy tên địa điểm từ tọa độ (reverse geocoding).
 * Dùng cho: recommendation module — hiển thị tên thành phố thay vì lat/lon.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<LocationInfo>}
 *
 * LocationInfo shape:
 * {
 *   displayName:  string   tên đầy đủ (VD: "Hà Nội, Việt Nam")
 *   city:         string | null
 *   district:     string | null
 *   state:        string | null
 *   country:      string | null
 *   countryCode:  string | null   "VN", "US", ...
 *   lat:          number
 *   lon:          number
 * }
 */
export async function reverseGeocode(lat, lon) {
  const data = await nominatimFetch("/reverse", { lat, lon, zoom: 10 });

  if (!data || data.error) {
    return {
      displayName:  null,
      city:         null,
      district:     null,
      state:        null,
      country:      null,
      countryCode:  null,
      lat,
      lon,
    };
  }

  const addr = data.address ?? {};

  return {
    displayName:  data.display_name ?? null,
    city:         addr.city ?? addr.town ?? addr.village ?? null,
    district:     addr.suburb ?? addr.district ?? null,
    state:        addr.state ?? null,
    country:      addr.country ?? null,
    countryCode:  addr.country_code?.toUpperCase() ?? null,
    lat:          parseFloat(data.lat ?? lat),
    lon:          parseFloat(data.lon ?? lon),
  };
}

// ─── Forward Geocoding ─────────────────────────────────────────────────────────

/**
 * Tìm tọa độ từ tên địa điểm (forward geocoding).
 * Dùng cho: observatory module — tìm địa điểm người dùng gõ vào.
 *
 * @param {string} query  - VD: "Hà Nội", "Hanoi Vietnam", "Paris"
 * @param {number} [limit=1]
 * @returns {Promise<GeoResult[]>}
 *
 * GeoResult shape:
 * {
 *   displayName: string
 *   lat:         number
 *   lon:         number
 *   type:        string  "city" | "state" | "country" | ...
 *   importance:  number  (0–1, Nominatim score)
 * }
 */
export async function geocode(query, limit = 1) {
  if (!query?.trim()) {
    throw new AppError("Cần nhập tên địa điểm để tìm kiếm", 400);
  }

  const data = await nominatimFetch("/search", { q: query, limit });

  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data.map((item) => ({
    displayName: item.display_name,
    lat:         parseFloat(item.lat),
    lon:         parseFloat(item.lon),
    type:        item.type,
    importance:  item.importance,
  }));
}

// ─── Khoảng cách Haversine ─────────────────────────────────────────────────────

/**
 * Tính khoảng cách (km) giữa 2 điểm theo công thức Haversine.
 * Không cần gọi API — tính thuần JavaScript.
 *
 * @param {{ lat: number, lon: number }} coord1
 * @param {{ lat: number, lon: number }} coord2
 * @returns {number} km (làm tròn 1 chữ số)
 */
export function calculateDistance(coord1, coord2) {
  const R = 6371; // bán kính Trái Đất (km)
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lon - coord1.lon);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) *
    Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

// ─── Tìm đài thiên văn gần đó ─────────────────────────────────────────────────

/**
 * Tìm đài thiên văn và địa điểm quan sát sao gần tọa độ người dùng.
 * Dùng Overpass API (dữ liệu OpenStreetMap) — cũng hoàn toàn miễn phí.
 *
 * Dùng cho: Observatory module — danh sách đài thiên văn kèm khoảng cách.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {number} [radiusKm=100]  - Bán kính tìm kiếm (km)
 * @returns {Promise<Observatory[]>}
 *
 * Observatory shape:
 * {
 *   id:           number   OSM node id
 *   name:         string
 *   lat:          number
 *   lon:          number
 *   distanceKm:   number
 *   type:         "observatory" | "planetarium" | "telescope" | "other"
 *   address:      string | null
 *   website:      string | null
 *   openingHours: string | null
 *   phone:        string | null
 * }
 */
export async function findNearbyObservatories(lat, lon, radiusKm = 100) {
  const radiusM = radiusKm * 1000;

  // Overpass QL query: tìm node/way có tag liên quan thiên văn
  const query = `
    [out:json][timeout:15];
    (
      node["man_made"="observatory"](around:${radiusM},${lat},${lon});
      node["amenity"="planetarium"](around:${radiusM},${lat},${lon});
      node["leisure"="observatory"](around:${radiusM},${lat},${lon});
      way["man_made"="observatory"](around:${radiusM},${lat},${lon});
    );
    out center;
  `.trim();

  const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

  let res;
  try {
    res = await fetchWithTimeout(
      OVERPASS_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      },
      15000 // Overpass chậm hơn — timeout 15s
    );
  } catch (err) {
    console.error("[maps.service] Overpass timeout:", err.message);
    return []; // trả mảng rỗng thay vì crash
  }

  if (!res.ok) {
    console.error("[maps.service] Overpass lỗi:", res.status);
    return [];
  }

  const data = await res.json();
  const elements = data.elements ?? [];

  const observatories = elements
    .map((el) => {
      // Way có center, node dùng trực tiếp lat/lon
      const elLat = el.center?.lat ?? el.lat;
      const elLon = el.center?.lon ?? el.lon;

      if (!elLat || !elLon) return null;

      const tags = el.tags ?? {};

      // Xác định type
      let type = "other";
      if (tags["man_made"] === "observatory" || tags["leisure"] === "observatory") {
        type = "observatory";
      } else if (tags["amenity"] === "planetarium") {
        type = "planetarium";
      }

      return {
        id:           el.id,
        name:         tags.name ?? tags["name:en"] ?? tags["name:vi"] ?? "Đài thiên văn",
        lat:          elLat,
        lon:          elLon,
        distanceKm:   calculateDistance({ lat, lon }, { lat: elLat, lon: elLon }),
        type,
        address:      tags["addr:full"] ?? tags["addr:city"] ?? null,
        website:      tags.website ?? tags.url ?? null,
        openingHours: tags.opening_hours ?? null,
        phone:        tags.phone ?? tags["contact:phone"] ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm); // gần nhất trước

  return observatories;
}

/**
 * Tạo URL static map để nhúng vào email/thông báo (không cần API key).
 * Dùng OpenStreetMap tile server qua openstreetmap.org.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {number} [zoom=12]
 * @returns {string}  URL nhúng được vào <img> hoặc <iframe>
 */
export function buildStaticMapUrl(lat, lon, zoom = 12) {
  // openstreetmap.org/export/embed cho phép nhúng vào iframe miễn phí
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.05},${lat - 0.05},${lon + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lon}`;
}
// Thêm vào cuối maps.service.js (File 2)

export function getBoundingBox(lat, lon, radiusKm) {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta, maxLat: lat + latDelta,
    minLon: lon - lonDelta, maxLon: lon + lonDelta,
  };
}

export function buildGoogleMapsDirectionUrl(lat, lon) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}