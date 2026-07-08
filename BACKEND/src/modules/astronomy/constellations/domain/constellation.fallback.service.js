import { constellations88 } from "../../../../data/constellations.88.js";

const fallbackBySlug = new Map(
  constellations88.map((constellation) => [constellation.slug, constellation])
);

const verifiedFallbackFields = [
  "rightAscension",
  "declination",
  "areaSqDeg",
  "quadrant",
  "visibleLatitudes",
];

export function withVerifiedConstellationFallback(constellation) {
  if (!constellation) return constellation;

  const fallback = fallbackBySlug.get(constellation.slug);
  if (!fallback) return constellation;

  return verifiedFallbackFields.reduce(
    (result, field) => ({
      ...result,
      [field]: isMissingValue(result[field]) ? fallback[field] : result[field],
    }),
    { ...constellation }
  );
}

function isMissingValue(value) {
  return value === null || value === undefined || value === "";
}
