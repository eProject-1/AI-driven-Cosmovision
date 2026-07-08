import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { constellations88 } from "../src/data/constellations-88.js";

const prisma = new PrismaClient();
const GALLERY_ROOT = path.join(process.cwd(), "ml", "data", "constellations");
const GALLERY_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const GALLERY_LIMIT = 15;

const toPrismaConstellation = (constellation) => {
  const { _category, _index, ...data } = constellation;
  return data;
};

function readGalleryImages(slug, constellationName) {
  const dir = path.join(GALLERY_ROOT, slug);
  if (!fs.existsSync(dir)) return [];

  let sources = [];
  const sourcePath = path.join(dir, "sources.json");
  if (fs.existsSync(sourcePath)) {
    try {
      sources = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    } catch {
      sources = [];
    }
  }

  const metadataByFile = new Map(sources.map((item) => [item.file, item]));
  return fs.readdirSync(dir)
    .filter((fileName) => GALLERY_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .sort((left, right) => {
      const leftSynthetic = left.startsWith("synthetic-") ? 1 : 0;
      const rightSynthetic = right.startsWith("synthetic-") ? 1 : 0;
      return leftSynthetic - rightSynthetic || left.localeCompare(right);
    })
    .slice(0, GALLERY_LIMIT)
    .map((fileName, index) => {
      const metadata = metadataByFile.get(fileName);
      return {
        id: crypto.randomUUID(),
        url: `/constellation-gallery/${encodeURIComponent(slug)}/${encodeURIComponent(fileName)}`,
        title: metadata?.title || `${constellationName} gallery image ${index + 1}`,
        source: metadata ? "Wikimedia dataset" : "Local training dataset",
        license: metadata?.license || null,
        sortOrder: index,
      };
    });
}

async function syncGalleryImages(constellation) {
  const images = readGalleryImages(constellation.slug, constellation.name);

  await prisma.$executeRaw`
    DELETE FROM "constellation_images"
    WHERE "constellationId" = ${constellation.id}
  `;

  for (const image of images) {
    await prisma.$executeRaw`
      INSERT INTO "constellation_images"
        ("id", "constellationId", "url", "title", "source", "license", "sortOrder")
      VALUES
        (${image.id}, ${constellation.id}, ${image.url}, ${image.title}, ${image.source}, ${image.license}, ${image.sortOrder})
    `;
  }
}

async function main() {
  for (const constellation of constellations88.map(toPrismaConstellation)) {
    const syncedConstellation = await prisma.constellation.upsert({
      where: { slug: constellation.slug },
      update: constellation,
      create: constellation,
    });
    await syncGalleryImages(syncedConstellation);
  }

  const count = await prisma.constellation.count({ where: { isVisible: true } });
  console.log(`Synced ${constellations88.length} constellations. Visible constellations in database: ${count}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
