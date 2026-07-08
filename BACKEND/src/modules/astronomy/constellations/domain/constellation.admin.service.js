import prisma from "../../../../config/db.js";
import { AppError } from "../../../../utils/app.error.util.js";
import { withVerifiedConstellationFallback } from "./constellation.fallback.service.js";

export async function createConstellation(payload) {
  const data = buildConstellationWriteData(payload, { requireBasics: true });
  const created = await prisma.constellation.create({ data });
  return withVerifiedConstellationFallback(created);
}

export async function updateConstellation(slug, payload) {
  const existing = await findConstellationIdBySlug(slug);
  const updated = await prisma.constellation.update({
    where: { id: existing.id },
    data: buildConstellationWriteData(payload),
  });
  return withVerifiedConstellationFallback(updated);
}

export async function deleteConstellation(slug) {
  const existing = await findConstellationIdBySlug(slug);
  await prisma.constellation.update({
    where: { id: existing.id },
    data: { isVisible: false },
  });
  return { slug, deleted: true };
}

const constellationWriteFields = [
  "name",
  "slug",
  "latinName",
  "abbreviation",
  "family",
  "quadrant",
  "rightAscension",
  "declination",
  "areaSqDeg",
  "visibleLatitudes",
  "mainStars",
  "brightestStar",
  "bestMonth",
  "bestSeason",
  "imageUrl",
  "mapUrl",
  "description",
  "mythologicalOrigin",
  "aiMythology",
  "aiFacts",
  "aiObserverTip",
  "isVisible",
];

async function findConstellationIdBySlug(slug) {
  const constellation = await prisma.constellation.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!constellation) throw new AppError("Constellation not found", 404);
  return constellation;
}

function buildConstellationWriteData(payload = {}, { requireBasics = false } = {}) {
  const data = pickDefined(payload, constellationWriteFields);

  if (data.name) data.name = String(data.name).trim();
  if (!data.slug && data.name && requireBasics) data.slug = slugify(data.name);
  if (data.slug) data.slug = slugify(data.slug);
  if (data.areaSqDeg !== undefined) data.areaSqDeg = Number(data.areaSqDeg);
  if (data.mainStars !== undefined) data.mainStars = Number.parseInt(data.mainStars, 10);
  if (data.aiFacts !== undefined && !Array.isArray(data.aiFacts)) data.aiFacts = [];

  if (requireBasics && (!data.name || !data.slug)) {
    throw new AppError("Constellation name is required.", 400);
  }

  return data;
}

function pickDefined(source, fields) {
  return fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});
}

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
