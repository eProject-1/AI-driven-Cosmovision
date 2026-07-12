import prisma from "../../../../config/db.js";
import { AppError } from "../../../../utils/app.error.util.js";
import { pickDefined } from "../../../../utils/service.helpers.util.js";
import { withVerifiedConstellationFallback } from "./constellation.fallback.service.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const categoryNames = {
  Mythology: [
    "Andromeda",
    "Aquarius",
    "Capricornus",
    "Centaurus",
    "Cetus",
    "Draco",
    "Pegasus",
    "Phoenix",
    "Sagittarius",
  ],
  Human: [
    "Auriga",
    "Bootes",
    "Cassiopeia",
    "Cepheus",
    "Coma Berenices",
    "Gemini",
    "Hercules",
    "Indus",
    "Ophiuchus",
    "Orion",
    "Perseus",
    "Virgo",
  ],
  Objects: [
    "Antlia",
    "Ara",
    "Caelum",
    "Carina",
    "Circinus",
    "Corona Australis",
    "Corona Borealis",
    "Crater",
    "Crux",
    "Eridanus",
    "Fornax",
    "Libra",
    "Lyra",
    "Mensa",
    "Microscopium",
    "Norma",
    "Octans",
    "Pictor",
    "Puppis",
    "Pyxis",
    "Reticulum",
    "Sagitta",
    "Sculptor",
    "Scutum",
    "Sextans",
    "Telescopium",
    "Triangulum",
    "Triangulum Australe",
    "Vela",
  ],
};

const nonAnimalNames = Object.values(categoryNames).flat();

export async function getAllConstellations(query = {}) {
  const { page, limit, skip, take } = parsePagination(query);
  const where = buildConstellationListWhere(query);

  const [constellations, total] = await Promise.all([
    prisma.constellation.findMany({
      where,
      select: constellationListSelect,
      orderBy: { name: "asc" },
      skip,
      take,
    }),
    prisma.constellation.count({ where }),
  ]);

  return {
    constellations: constellations.map(withVerifiedConstellationFallback),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + take < total,
      hasPrev: page > 1,
    },
  };
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

function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE)
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

function buildConstellationListWhere({ search, season, quadrant, letter, category, hemisphere }) {
  const where = { isVisible: true };
  const and = [];

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { latinName: { contains: search, mode: "insensitive" } },
        { abbreviation: { contains: search, mode: "insensitive" } },
        { brightestStar: { contains: search, mode: "insensitive" } },
        { family: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (season) {
    where.bestSeason = { equals: season, mode: "insensitive" };
  }

  if (quadrant) {
    where.quadrant = { equals: quadrant, mode: "insensitive" };
  }

  if (letter && /^[a-z]$/i.test(letter)) {
    and.push({ name: { startsWith: letter, mode: "insensitive" } });
  }

  if (hemisphere === "Northern") {
    where.quadrant = { startsWith: "N", mode: "insensitive" };
  } else if (hemisphere === "Southern") {
    where.quadrant = { startsWith: "S", mode: "insensitive" };
  } else if (hemisphere === "Equatorial") {
    and.push({
      OR: [
        { quadrant: null },
        {
          AND: [
            { quadrant: { not: { startsWith: "N", mode: "insensitive" } } },
            { quadrant: { not: { startsWith: "S", mode: "insensitive" } } },
          ],
        },
      ],
    });
  }

  if (category && category !== "All") {
    if (category === "Animals") {
      and.push({ name: { notIn: nonAnimalNames } });
    } else if (categoryNames[category]) {
      and.push({ name: { in: categoryNames[category] } });
    }
  }

  if (and.length) where.AND = and;

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

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
