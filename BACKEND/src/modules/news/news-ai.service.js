import prisma from "../../config/db.js";
import groq from "../../config/groq.js";
import { AppError } from "../../utils/AppError.js";

function buildArticleContext(article) {
  return `Title: ${article.title}
Summary: ${article.summary || "No summary available"}`.trim();
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
  const article = await getNewsArticleById(articleId);

  if (article.summary && !force) {
    return article;
  }

  const summary = await summarizeWithGroq(article);

  return prisma.newsArticle.update({
    where: { id: article.id },
    data: { summary },
  });
}
