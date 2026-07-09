import fs from "fs";
import path from "path";
import prisma from "../../../../config/db.js";
import { AppError } from "../../../../utils/app.error.util.js";

const galleryRoot = path.join(process.cwd(), "ml", "data", "constellations");
const galleryImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export async function getConstellationGallery(slug, { baseUrl, limit = 15 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 15, 1), 15);
  const constellation = await findConstellationForGallery(slug);
  const images = await collectConstellationImages(constellation, { baseUrl, safeLimit });

  return {
    constellation: {
      id: constellation.id,
      name: constellation.name,
      slug: constellation.slug,
    },
    images,
    wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(constellation.name.replace(/\s+/g, "_"))}`,
  };
}

export async function getRelatedConstellations(slug) {
  const current = await prisma.constellation.findUnique({
    where: { slug },
    select: { id: true, family: true, quadrant: true },
  });

  if (!current) throw new AppError("Constellation not found", 404);

  const byFamily = await findRelatedByFamily(current);
  if (byFamily.length >= 2) return byFamily;

  const byQuadrant = await findRelatedByQuadrant(current, byFamily);
  return [...byFamily, ...byQuadrant];
}

const relatedConstellationSelect = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
  family: true,
  abbreviation: true,
};

async function findConstellationForGallery(slug) {
  const constellation = await prisma.constellation.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      mapUrl: true,
    },
  });

  if (!constellation) throw new AppError("Constellation not found", 404);
  return constellation;
}

async function findRelatedByFamily(current) {
  if (!current.family) return [];

  return prisma.constellation.findMany({
    where: {
      isVisible: true,
      family: current.family,
      id: { not: current.id },
    },
    select: relatedConstellationSelect,
    take: 4,
  });
}

async function findRelatedByQuadrant(current, byFamily) {
  if (!current.quadrant) return [];

  return prisma.constellation.findMany({
    where: {
      isVisible: true,
      quadrant: current.quadrant,
      id: { notIn: [current.id, ...byFamily.map((constellation) => constellation.id)] },
    },
    select: relatedConstellationSelect,
    take: 4 - byFamily.length,
  });
}

async function collectConstellationImages(constellation, { baseUrl, safeLimit }) {
  const images = [];
  const addImage = createGalleryAccumulator({ images, seen: new Set(), safeLimit });

  addImage({
    url: constellation.imageUrl,
    title: `${constellation.name} constellation image`,
    source: "Constellation DB",
  });
  addImage({
    url: constellation.mapUrl,
    title: `${constellation.name} sky map`,
    source: "Constellation DB",
  });

  await addDbGalleryImages(addImage, constellation, { baseUrl, safeLimit });
  addLocalGalleryImages(addImage, constellation, { baseUrl, safeLimit });

  return images;
}

function createGalleryAccumulator({ images, seen, safeLimit }) {
  return (image) => {
    if (!image?.url || seen.has(image.url) || images.length >= safeLimit) return;
    seen.add(image.url);
    images.push(image);
  };
}

async function addDbGalleryImages(addImage, constellation, { baseUrl, safeLimit }) {
  try {
    const dbGalleryImages = await prisma.$queryRaw`
      SELECT "id", "url", "title", "source", "license", "sortOrder"
      FROM "constellation_images"
      WHERE "constellationId" = ${constellation.id}
      ORDER BY "sortOrder" ASC, "createdAt" DESC
      LIMIT ${safeLimit}
    `;

    for (const image of dbGalleryImages) {
      const url = image.url?.startsWith("/") && baseUrl ? toPublicUrl(baseUrl, image.url) : image.url;
      addImage({
        id: image.id,
        url,
        title: image.title || `${constellation.name} gallery image`,
        source: image.source || "ConstellationImage DB",
        license: image.license,
      });
    }
  } catch {
    // The gallery table may not exist until the migration has been applied.
  }
}

function addLocalGalleryImages(addImage, constellation, { baseUrl, safeLimit }) {
  if (!baseUrl) return;

  for (const [index, item] of readLocalGallerySources(constellation.slug).entries()) {
    addImage({
      url: toPublicUrl(
        baseUrl,
        `/constellation-gallery/${encodeURIComponent(constellation.slug)}/${encodeURIComponent(item.fileName)}`
      ),
      title: item.metadata?.title || `${constellation.name} gallery image ${index + 1}`,
      source: item.metadata ? "Wikimedia dataset" : "Local training dataset",
      license: item.metadata?.license,
    });

    if (index + 1 >= safeLimit) break;
  }
}

function readLocalGallerySources(slug) {
  const galleryDir = path.join(galleryRoot, slug);
  const resolvedGalleryDir = path.resolve(galleryDir);
  const resolvedRoot = path.resolve(galleryRoot);

  if (!resolvedGalleryDir.startsWith(resolvedRoot) || !fs.existsSync(resolvedGalleryDir)) {
    return [];
  }

  const metadataByFile = new Map(
    readLocalGalleryMetadata(resolvedGalleryDir).map((item) => [item.file, item])
  );
  return fs.readdirSync(resolvedGalleryDir)
    .filter((fileName) => galleryImageExtensions.has(path.extname(fileName).toLowerCase()))
    .sort(sortGalleryFileNames)
    .map((fileName) => ({
      fileName,
      metadata: metadataByFile.get(fileName),
    }));
}

function readLocalGalleryMetadata(galleryDir) {
  const sourcePath = path.join(galleryDir, "sources.json");
  if (!fs.existsSync(sourcePath)) return [];

  try {
    return JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  } catch {
    return [];
  }
}

function sortGalleryFileNames(left, right) {
  const leftSynthetic = left.startsWith("synthetic-") ? 1 : 0;
  const rightSynthetic = right.startsWith("synthetic-") ? 1 : 0;
  return leftSynthetic - rightSynthetic || left.localeCompare(right);
}

function toPublicUrl(baseUrl, pathname) {
  return `${baseUrl.replace(/\/$/, "")}${pathname}`;
}
