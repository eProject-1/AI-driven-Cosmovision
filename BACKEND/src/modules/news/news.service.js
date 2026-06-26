import prisma from "../../config/db.js";
import groq from "../../config/groq.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";

import {
  fetchAstronomyNews,
  fetchNasaNews,
  fetchExoplanetNews,
} from "../../services/external/news.service.js";

let maintenanceTimer = null;

function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function mapArticleCategory(article) {
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

function buildTags(article) {
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

async function generateUniqueSlug(title) {
  const baseSlug = slugify(title || "news-article") || "news-article";
  let slug = baseSlug;
  let index = 1;

  while (await prisma.newsArticle.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${index}`;
    index++;
  }

  return slug;
}

async function upsertExternalArticle(article) {
  const sourceUrl = article.url || article.sourceUrl || null;

  if (!sourceUrl || !article.title) {
    return null;
  }

  const existing = await prisma.newsArticle.findFirst({
    where: { sourceUrl },
  });

  if (existing) {
    return existing;
  }

  const slug = await generateUniqueSlug(article.title);
  const publishedAt = article.publishedAt || article.published_at;

  return prisma.newsArticle.create({
    data: {
      title: article.title,
      slug,
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
  const skip = (Number(page) - 1) * Number(limit);

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
      take: Number(limit),
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

export async function cleanupOldNews({ retentionDays = env.NEWS_RETENTION_DAYS } = {}) {
  const days = Number(retentionDays) || env.NEWS_RETENTION_DAYS;
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await prisma.newsArticle.deleteMany({
    where: {
      publishedAt: {
        lt: cutoffDate,
      },
    },
  });

  return {
    deleted: result.count,
    retentionDays: days,
    cutoffDate,
  };
}

export async function runNewsMaintenance({
  query = "space",
  pageSize = 20,
  retentionDays = env.NEWS_RETENTION_DAYS,
} = {}) {
  const [fetchOutcome, cleanupOutcome] = await Promise.allSettled([
    fetchLatestNews({ query, pageSize }),
    cleanupOldNews({ retentionDays }),
  ]);

  const fetchResult =
    fetchOutcome.status === "fulfilled"
      ? fetchOutcome.value
      : { fetched: 0, saved: 0, error: fetchOutcome.reason?.message || "Fetch failed" };

const cleanupResult =
    cleanupOutcome.status === "fulfilled"
      ? cleanupOutcome.value
      : {
          deleted: 0,
          retentionDays,
          cutoffDate: null,
          error: cleanupOutcome.reason?.message || "Cleanup failed",
        };

  return {
    fetched: fetchResult.fetched,
    saved: fetchResult.saved,
    fetchError: fetchResult.error || null,
    deleted: cleanupResult.deleted,
    retentionDays: cleanupResult.retentionDays,
    cutoffDate: cleanupResult.cutoffDate,
    cleanupError: cleanupResult.error || null,
  };
}

export function startNewsMaintenanceJob() {
  if (!env.NEWS_AUTO_FETCH_ENABLED || maintenanceTimer) return maintenanceTimer;

  const intervalMs = Math.max(5, env.NEWS_AUTO_FETCH_INTERVAL_MINUTES) * 60 * 1000;

  const runSafely = async (reason) => {
    try {
      const result = await runNewsMaintenance();
      console.log(
        `[news] maintenance ${reason}: fetched=${result.fetched}, saved=${result.saved}, deleted=${result.deleted}`
      );
    } catch (error) {
      console.error("[news] maintenance failed:", error.message);
    }
  };

  const startupTimer = setTimeout(() => runSafely("startup"), 5000);
  if (typeof startupTimer.unref === "function") startupTimer.unref();

  maintenanceTimer = setInterval(() => runSafely("interval"), intervalMs);
  if (typeof maintenanceTimer.unref === "function") maintenanceTimer.unref();

  return maintenanceTimer;
}

function buildArticleContext(article) {
  return `Title: ${article.title}
Summary: ${article.summary || "No summary available"}`.trim();
}

async function getNewsArticleById(articleId) {
  const article = await prisma.newsArticle.findUnique({
    where: { id: articleId },
  });

  if (!article) throw new AppError("News article not found", 404);
  return article;
}

async function runNewsGroq({ system, user, maxTokens = 300, temperature = 0.3 }) {
  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return completion.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    const status = error.status || error.statusCode;
    const code = error.error?.code || error.code;

    if (status === 401 || code === "invalid_api_key") {
      throw new AppError(
        "AI provider API key is invalid. Please update GROQ_API_KEY in BACKEND/.env and restart the backend.",
        503
      );
    }

    throw new AppError(error.message || "AI provider request failed.", 502);
  }
}

function parseJsonArray(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("Expected JSON array");
  return parsed.map(String).filter(Boolean).slice(0, 5);
}

export async function generateNewsAiSummary(articleId, { force = false } = {}) {
  const article = await getNewsArticleById(articleId);
  if (article.aiSummary && !force) return article;

  const aiSummary = await runNewsGroq({
    system:
      "You are an astronomy news editor. Summarize astronomy and space-related news accurately. Use ONLY the provided title and summary. Simple English. Max 80 words. Exactly 3 bullet points. Do not invent dates, causes, companies, outcomes, or background details. If the provided text lacks detail, say that the article does not provide enough detail.",
    user: `${buildArticleContext(article)}

Generate a concise summary.`,
    maxTokens: 220,
  });

  return prisma.newsArticle.update({
    where: { id: article.id },
    data: { aiSummary },
  });
}

export async function generateNewsImportance(articleId, { force = false } = {}) {
  const article = await getNewsArticleById(articleId);
  if (article.importance && !force) return article;

  const importance = await runNewsGroq({
    system: "Explain why this astronomy news matters in under 60 words. Be factual.",
    user: buildArticleContext(article),
    maxTokens: 160,
  });

  return prisma.newsArticle.update({
    where: { id: article.id },
    data: { importance },
  });
}

export async function generateNewsAiCategory(articleId, { force = false } = {}) {
  const article = await getNewsArticleById(articleId);
  if (article.aiCategory && !force) return article;

  const aiCategory = await runNewsGroq({
    system:
      "Choose ONLY ONE category: SPACE_EXPLORATION, SOLAR_SYSTEM, DEEP_SPACE, TECHNOLOGY, ASTROBIOLOGY, SATELLITE, GENERAL. Return only the category.",
    user: buildArticleContext(article),
    maxTokens: 40,
    temperature: 0,
  });

  return prisma.newsArticle.update({
    where: { id: article.id },
    data: { aiCategory: aiCategory.split(/\s+/)[0] || "GENERAL" },
  });
}

export async function generateNewsAiTags(articleId, { force = false } = {}) {
  const article = await getNewsArticleById(articleId);
  if (article.tags?.length && !force) return article;

  const raw = await runNewsGroq({
    system: "Extract up to 5 astronomy keywords. Return JSON array only.",
    user: buildArticleContext(article),
    maxTokens: 120,
    temperature: 0.1,
  });

  let tags;
  try {
    tags = parseJsonArray(raw);
  } catch {
    tags = buildTags(article);
  }

  return prisma.newsArticle.update({
    where: { id: article.id },
    data: { tags },
  });
}

export async function explainNewsArticle(articleId) {
  const article = await getNewsArticleById(articleId);
  const explanation = await runNewsGroq({
    system: "You are an astronomy teacher. Explain astronomy concepts in simple language for beginners.",
    user: `Explain this article.
${buildArticleContext(article)}`,
    maxTokens: 420,
    temperature: 0.4,
  });

  return { articleId: article.id, explanation };
}

export async function answerNewsQuestion(articleId, question) {
  const article = await getNewsArticleById(articleId);
  const answer = await runNewsGroq({
    system:
      "Answer questions ONLY using the provided article. If insufficient information, reply: I don't have enough information in this article.",
    user: `Article:
${buildArticleContext(article)}

Question: ${question}`,
    maxTokens: 260,
    temperature: 0.2,
  });

  return { articleId: article.id, question, answer };
}

export async function getNewsBySlug(slug) {
  const article = await prisma.newsArticle.findUnique({
    where: { slug },
  });

  if (!article) throw new AppError("News article not found", 404);

  return article;
}

export async function fetchLatestNews({ query, pageSize = 10 } = {}) {
  const result = await fetchAstronomyNews({
    query,
    pageSize,
    page: 1,
    language: "en",
    sortBy: "publishedAt",
  });

  if (!result.success) {
    throw new AppError(result.message || "Failed to fetch external news", 502);
  }

  const savedArticles = [];

  for (const article of result.data) {
    const saved = await upsertExternalArticle(article);
    if (saved) savedArticles.push(saved);
  }

  return {
    fetched: result.count,
    saved: savedArticles.length,
    articles: savedArticles,
  };
}

export async function fetchLatestNasaNews({ pageSize = 10 } = {}) {
  const result = await fetchNasaNews({ pageSize, page: 1 });

  if (!result.success) {
    throw new AppError(result.message || "Failed to fetch NASA news", 502);
  }

  const savedArticles = [];

  for (const article of result.data) {
    const saved = await upsertExternalArticle(article);
    if (saved) savedArticles.push(saved);
  }

  return {
    fetched: result.count,
    saved: savedArticles.length,
    articles: savedArticles,
  };
}

export async function fetchLatestExoplanetNews({ pageSize = 10 } = {}) {
  const result = await fetchExoplanetNews({ pageSize, page: 1 });

  if (!result.success) {
    throw new AppError(result.message || "Failed to fetch exoplanet news", 502);
  }

  const savedArticles = [];

  for (const article of result.data) {
    const saved = await upsertExternalArticle(article);
    if (saved) savedArticles.push(saved);
  }

  return {
    fetched: result.count,
    saved: savedArticles.length,
    articles: savedArticles,
  };
}

async function summarizeWithGroq(article) {
  const content = `
Title: ${article.title}
Source: ${article.source}
Published At: ${article.publishedAt}
Existing summary: ${article.summary || "No summary available"}
Article URL: ${article.sourceUrl}
Tags: ${article.tags?.join(", ") || "No tags"}
`.trim();

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are an astronomy news editor. Summarize astronomy and space articles in clear, concise English for a general audience.",
      },
      {
        role: "user",
        content: `
Summarize the following astronomy news article in 3 short bullet points.
Do not invent details that are not present in the provided content.

${content}
`.trim(),
      },
    ],
    temperature: 0.4,
    max_tokens: 350,
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
}

export async function summarizeNewsArticle(articleId, { force = false } = {}) {
  const article = await prisma.newsArticle.findUnique({
    where: { id: articleId },
  });

  if (!article) throw new AppError("News article not found", 404);

  if (article.summary && !force) {
    return article;
  }

  const summary = await summarizeWithGroq(article);

  return prisma.newsArticle.update({
    where: { id: article.id },
    data: {
      summary,
    },
  });
}

export async function getDashboardNewsHighlights(limit = 5) {
  return prisma.newsArticle.findMany({
    orderBy: { publishedAt: "desc" },
    take: Number(limit),
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
