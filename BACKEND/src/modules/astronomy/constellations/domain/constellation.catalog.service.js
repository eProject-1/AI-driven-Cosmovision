import prisma from "../../../../config/db.js";
import { AppError } from "../../../../utils/app.error.util.js";
import { withVerifiedConstellationFallback } from "./constellation.fallback.service.js";

export async function getAllConstellations({ search, season, quadrant } = {}) {
  const constellations = await prisma.constellation.findMany({
    where: buildConstellationListWhere({ search, season, quadrant }),
    select: constellationListSelect,
    orderBy: { name: "asc" },
  });

  return constellations.map(withVerifiedConstellationFallback);
}

export async function getConstellationBySlug(slug) {
  const constellation = await prisma.constellation.findUnique({
    where: { slug },
  });

  if (!constellation) throw new AppError("Constellation not found", 404);
  return withVerifiedConstellationFallback(constellation);
}

export async function getConstellationsByMonth(month) {
  const monthName = getMonthName(month);
  const constellations = await prisma.constellation.findMany({
    where: {
      isVisible: true,
      bestMonth: { equals: monthName, mode: "insensitive" },
    },
    select: constellationByMonthSelect,
    orderBy: { name: "asc" },
  });

  return constellations.map(withVerifiedConstellationFallback);
}

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

const constellationListSelect = {
  id: true,
  name: true,
  slug: true,
  latinName: true,
  abbreviation: true,
  imageUrl: true,
  description: true,
  mythologicalOrigin: true,
  brightestStar: true,
  bestMonth: true,
  bestSeason: true,
  quadrant: true,
  rightAscension: true,
  declination: true,
  family: true,
  areaSqDeg: true,
  visibleLatitudes: true,
  mainStars: true,
  aiFacts: true,
  aiObserverTip: true,
};

const constellationByMonthSelect = {
  id: true,
  name: true,
  slug: true,
  latinName: true,
  abbreviation: true,
  imageUrl: true,
  brightestStar: true,
  bestSeason: true,
};

const monthNames = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

function buildConstellationListWhere({ search, season, quadrant }) {
  const where = { isVisible: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { latinName: { contains: search, mode: "insensitive" } },
      { abbreviation: { contains: search, mode: "insensitive" } },
    ];
  }

  if (season) {
    where.bestSeason = { equals: season, mode: "insensitive" };
  }

  if (quadrant) {
    where.quadrant = { equals: quadrant, mode: "insensitive" };
  }

  return where;
}

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

function getMonthName(month) {
  const monthNum = Number(month);
  if (!monthNum || monthNum < 1 || monthNum > 12) {
    throw new AppError("Invalid month. Must be 1-12.", 400);
  }

  return monthNames[monthNum];
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
