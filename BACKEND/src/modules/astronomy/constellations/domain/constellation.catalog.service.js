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

function getMonthName(month) {
  const monthNum = Number(month);
  if (!monthNum || monthNum < 1 || monthNum > 12) {
    throw new AppError("Invalid month. Must be 1-12.", 400);
  }

  return monthNames[monthNum];
}
