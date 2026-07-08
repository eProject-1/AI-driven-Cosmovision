import prisma from "../../config/db.js";
import { AppError } from "../../utils/app.error.util.js";
import { formatObservatory } from "./observatory.helpers.js";

export async function createObservatory(payload) {
  const data = buildObservatoryWriteData(payload, { requireBasics: true });
  const observatory = await prisma.observatory.create({ data });
  return formatObservatory(observatory);
}

export async function updateObservatory(slug, payload) {
  const existing = await findObservatoryIdBySlug(slug);
  const observatory = await prisma.observatory.update({
    where: { id: existing.id },
    data: buildObservatoryWriteData(payload),
  });
  return formatObservatory(observatory);
}

export async function deleteObservatory(slug) {
  const existing = await findObservatoryIdBySlug(slug);
  await prisma.observatory.update({
    where: { id: existing.id },
    data: { isActive: false },
  });
  return { slug, deleted: true };
}

const observatoryWriteFields = [
  "name",
  "slug",
  "description",
  "type",
  "latitude",
  "longitude",
  "address",
  "city",
  "province",
  "country",
  "elevation",
  "website",
  "phone",
  "email",
  "imageUrl",
  "equipment",
  "openingHours",
  "rating",
  "reviewCount",
  "lightPollutionScore",
  "skyQualityScore",
  "isFeatured",
  "isActive",
];

async function findObservatoryIdBySlug(slug) {
  const observatory = await prisma.observatory.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!observatory) throw new AppError("Observatory not found", 404);
  return observatory;
}

function buildObservatoryWriteData(payload = {}, { requireBasics = false } = {}) {
  const data = pickDefined(payload, observatoryWriteFields);

  if (data.name) data.name = String(data.name).trim();
  if (!data.slug && data.name && requireBasics) data.slug = slugify(data.name);
  if (data.slug) data.slug = slugify(data.slug);
  if (data.type) data.type = String(data.type).toUpperCase();
  if (data.equipment !== undefined && !Array.isArray(data.equipment)) data.equipment = [];

  for (const field of [
    "latitude",
    "longitude",
    "elevation",
    "rating",
    "lightPollutionScore",
    "skyQualityScore",
  ]) {
    if (data[field] !== undefined) data[field] = Number(data[field]);
  }
  if (data.reviewCount !== undefined) data.reviewCount = Number.parseInt(data.reviewCount, 10);

  if (
    requireBasics &&
    (!data.name || !data.slug || !data.description || data.latitude === undefined || data.longitude === undefined)
  ) {
    throw new AppError("Observatory name, description, latitude, and longitude are required.", 400);
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
