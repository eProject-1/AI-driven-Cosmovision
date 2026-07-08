import { AppError } from "../../utils/app.error.util.js";
import { calculateDistanceKm } from "../../utils/geo.util.js";
import { createLogger } from "../../utils/logger.util.js";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "CosmoVision-AI/1.0 (astronomy-portal; contact@cosmovision.edu.vn)";
const FETCH_TIMEOUT_MS = 8000;
const logger = createLogger("maps");

export async function reverseGeocode(lat, lon) {
  const data = await nominatimFetch("/reverse", { lat, lon, zoom: 10 });
  if (!data || data.error) return emptyLocation(lat, lon);

  const address = data.address ?? {};
  return {
    displayName: data.display_name ?? null,
    city: address.city ?? address.town ?? address.village ?? null,
    district: address.suburb ?? address.district ?? null,
    state: address.state ?? null,
    country: address.country ?? null,
    countryCode: address.country_code?.toUpperCase() ?? null,
    lat: parseFloat(data.lat ?? lat),
    lon: parseFloat(data.lon ?? lon),
  };
}

export async function geocode(query, limit = 1) {
  if (!query?.trim()) {
    throw new AppError("Location name is required.", 400);
  }

  const data = await nominatimFetch("/search", { q: query, limit });
  if (!Array.isArray(data) || data.length === 0) return [];

  return data.map((item) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    type: item.type,
    importance: item.importance,
  }));
}

export function calculateDistance(coord1, coord2) {
  const distanceKm = calculateDistanceKm(coord1.lat, coord1.lon, coord2.lat, coord2.lon);
  return distanceKm === null ? null : Math.round(distanceKm * 10) / 10;
}

export async function findNearbyObservatories(lat, lon, radiusKm = 100) {
  const elements = await fetchOverpassObservatories(lat, lon, radiusKm);

  return elements
    .map((element) => mapOverpassObservatory(element, { lat, lon }))
    .filter(Boolean)
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

export function buildStaticMapUrl(lat, lon) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.05},${lat - 0.05},${lon + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lon}`;
}

export function getBoundingBox(lat, lon, radiusKm) {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  };
}

export function buildGoogleMapsDirectionUrl(lat, lon) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

async function nominatimFetch(endpoint, params = {}) {
  const searchParams = new URLSearchParams({ ...params, format: "json" });
  const url = `${NOMINATIM_BASE}${endpoint}?${searchParams.toString()}`;

  let response;
  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    throw new AppError(`Nominatim timeout or connection failed: ${error.message}`, 503);
  }

  if (!response.ok) {
    throw new AppError(`Nominatim API failed: HTTP ${response.status}`, 502);
  }

  return response.json();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "vi,en",
        ...(options.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function emptyLocation(lat, lon) {
  return {
    displayName: null,
    city: null,
    district: null,
    state: null,
    country: null,
    countryCode: null,
    lat,
    lon,
  };
}

async function fetchOverpassObservatories(lat, lon, radiusKm) {
  const query = buildOverpassQuery(lat, lon, radiusKm);
  let response;

  try {
    response = await fetchWithTimeout(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      },
      15000
    );
  } catch (error) {
    logger.error("Overpass timeout", error);
    return [];
  }

  if (!response.ok) {
    logger.error("Overpass failed", `HTTP ${response.status}`);
    return [];
  }

  const data = await response.json();
  return data.elements ?? [];
}

function buildOverpassQuery(lat, lon, radiusKm) {
  const radiusM = radiusKm * 1000;
  return `
    [out:json][timeout:15];
    (
      node["man_made"="observatory"](around:${radiusM},${lat},${lon});
      node["amenity"="planetarium"](around:${radiusM},${lat},${lon});
      node["leisure"="observatory"](around:${radiusM},${lat},${lon});
      way["man_made"="observatory"](around:${radiusM},${lat},${lon});
    );
    out center;
  `.trim();
}

function mapOverpassObservatory(element, origin) {
  const lat = element.center?.lat ?? element.lat;
  const lon = element.center?.lon ?? element.lon;
  if (!lat || !lon) return null;

  const tags = element.tags ?? {};
  return {
    id: element.id,
    name: tags.name ?? tags["name:en"] ?? tags["name:vi"] ?? "Observatory",
    lat,
    lon,
    distanceKm: calculateDistance(origin, { lat, lon }),
    type: getOverpassObservatoryType(tags),
    address: tags["addr:full"] ?? tags["addr:city"] ?? null,
    website: tags.website ?? tags.url ?? null,
    openingHours: tags.opening_hours ?? null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
  };
}

function getOverpassObservatoryType(tags) {
  if (tags["man_made"] === "observatory" || tags["leisure"] === "observatory") {
    return "observatory";
  }
  if (tags.amenity === "planetarium") return "planetarium";
  return "other";
}
