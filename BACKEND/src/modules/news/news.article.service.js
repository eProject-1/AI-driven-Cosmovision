import prisma from "../../config/db.js";
import { AppError } from "../../utils/app-error.util.js";
import { clampInteger } from "../../utils/service.util.js";

export function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function mapArticleCategory(article) {
  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  if (text.includes("nasa") || text.includes("mission") || text.includes("spaceflight")) {
    return "SPACE_EXPLORATION";
  }
  if (text.includes("planet") || text.includes("mars") || text.includes("jupiter") || text.includes("solar system")) {
    return "SOLAR_SYSTEM";
  }
  if (text.includes("galaxy") || text.includes("black hole") || text.includes("exoplanet") || text.includes("deep space")) {
    return "DEEP_SPACE";
  }
  if (text.includes("telescope") || text.includes("rocket") || text.includes("technology")) {
    return "TECHNOLOGY";
  }

  return "GENERAL";
}

export function buildTags(article) {
  const tags = new Set();
  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();
  const candidates = [
    "NASA",
    "Mars",
    "Moon",
    "Exoplanet",
    "Galaxy",
    "Telescope",
    "Rocket",
    "SpaceX",
    "Artemis",
    "James Webb",
    "Astronomy",
  ];

  for (const tag of candidates) {
    if (text.includes(tag.toLowerCase())) tags.add(tag);
  }

  return Array.from(tags);
}

export async function generateUniqueSlug(title) {
  const baseSlug = slugify(title || "news-article") || "news-article";
  let slug = baseSlug;
  let index = 1;

  while (await prisma.newsArticle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return slug;
}

export async function upsertExternalArticle(article) {
  const sourceUrl = article.url || article.sourceUrl || null;
  if (!sourceUrl || !article.title) return null;

  const existing = await prisma.newsArticle.findFirst({ where: { sourceUrl } });
  if (existing) return existing;

  const publishedAt = article.publishedAt || article.published_at;
  return prisma.newsArticle.create({
    data: {
      title: article.title,
      slug: await generateUniqueSlug(article.title),
      source: article.source || article.news_site || "Spaceflight News",
      sourceUrl,
      imageUrl: article.imageUrl || article.image_url || null,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      category: mapArticleCategory(article),
      summary: article.summary || article.description || article.content || null,
      tags: buildTags(article),
      fetchedAt: new Date(),
    },
  });
}

export async function getNewsList({ page = 1, limit = 10, category, search } = {}) {
  const safePage = clampInteger(page, { fallback: 1, max: 10_000 });
  const safeLimit = clampInteger(limit);
  const skip = (safePage - 1) * safeLimit;
  const where = {
    ...(category && { category }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { source: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: safeLimit,
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function getNewsBySlug(slug) {
  const article = await prisma.newsArticle.findUnique({ where: { slug } });
  if (!article) throw new AppError("News article not found", 404);
  return article;
}

export async function createNewsArticle(payload) {
  const data = await buildNewsArticleWriteData(payload, { requireBasics: true });
  return prisma.newsArticle.create({ data });
}

export async function updateNewsArticle(slug, payload) {
  const existing = await prisma.newsArticle.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing) throw new AppError("News article not found", 404);

  return prisma.newsArticle.update({
    where: { id: existing.id },
    data: await buildNewsArticleWriteData(payload),
  });
}

export async function deleteNewsArticle(slug) {
  const existing = await prisma.newsArticle.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing) throw new AppError("News article not found", 404);

  await prisma.newsArticle.delete({ where: { id: existing.id } });
  return { slug, deleted: true };
}

export async function getDashboardNewsHighlights(limit = 5) {
  const safeLimit = clampInteger(limit, { fallback: 5 });
  return prisma.newsArticle.findMany({
    orderBy: { publishedAt: "desc" },
    take: safeLimit,
    select: {
      id: true,
      title: true,
      slug: true,
      source: true,
      sourceUrl: true,
      imageUrl: true,
      publishedAt: true,
      category: true,
      summary: true,
      aiSummary: true,
      importance: true,
      aiCategory: true,
      tags: true,
    },
  });
}

const newsArticleWriteFields = [
  "title",
  "slug",
  "source",
  "sourceUrl",
  "imageUrl",
  "publishedAt",
  "category",
  "summary",
  "aiSummary",
  "importance",
  "aiCategory",
  "tags",
];

async function buildNewsArticleWriteData(payload = {}, { requireBasics = false } = {}) {
  const data = pickDefined(payload, newsArticleWriteFields);

  if (data.title) data.title = String(data.title).trim();
  if (!data.slug && data.title && requireBasics) data.slug = await generateUniqueSlug(data.title);
  if (data.slug) data.slug = slugify(data.slug);
  if (data.publishedAt !== undefined) data.publishedAt = new Date(data.publishedAt);
  if (data.tags !== undefined && !Array.isArray(data.tags)) data.tags = [];

  if (requireBasics && (!data.title || !data.slug || !data.source || !data.sourceUrl)) {
    throw new AppError("News title, source, and sourceUrl are required.", 400);
  }
  if (requireBasics && !data.publishedAt) data.publishedAt = new Date();

  return data;
}

function pickDefined(source, fields) {
  return fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});
}
