import prisma from "../../config/db.js";
import groq from "../../config/groq.js";
import { formatPlainAiResponse, stripAiMarkdown, stripJsonFences } from "../../utils/ai.response.util.js";
import { AppError } from "../../utils/app.error.util.js";

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
  const parsed = JSON.parse(stripJsonFences(raw));
  if (!Array.isArray(parsed)) throw new Error("Expected JSON array");
  return parsed.map(String).filter(Boolean).slice(0, 5);
}

function tryParseJson(raw) {
  const cleaned = stripJsonFences(raw);

  try {
    return JSON.parse(cleaned);
  } catch {
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;

    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      return null;
    }
  }
}

function collectJsonLines(value, lines = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLines(item, lines);
    return lines;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectJsonLines(item, lines);
    return lines;
  }

  const text = stripAiMarkdown(value);
  if (text) lines.push(text);
  return lines;
}

function normalizeBulletLine(line) {
  return stripAiMarkdown(line)
    .replace(/^\s*[-*•]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatBulletList(raw, { maxItems = 5 } = {}) {
  const parsedJson = tryParseJson(raw);
  const sourceLines = parsedJson
    ? collectJsonLines(parsedJson)
    : String(raw || "").split(/\n+/);

  const bullets = sourceLines
    .flatMap((line) => String(line).split(/(?=\s[-*•]\s+)/g))
    .map(normalizeBulletLine)
    .filter(Boolean)
    .filter((line) => !/^[\[{ }"':,]+$/.test(line))
    .slice(0, maxItems);

  if (!bullets.length) return "- The article does not provide enough detail to explain further.";
  return bullets.map((line) => `- ${line}`).join("\n");
}

function normalizeExplainLine(line) {
  return stripAiMarkdown(line)
    .replace(/^\s*[-*.\u2022]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getExplainMarker(line) {
  const text = String(line || "").trim();
  if (/^\.\s+/.test(text) || /^\u2022\s+/.test(text)) return ".";
  if (/^[-*]\s+/.test(text)) return "-";
  return "";
}

function formatStructuredExplanation(raw, { maxItems = 8 } = {}) {
  const parsedJson = tryParseJson(raw);
  const sourceLines = parsedJson
    ? collectJsonLines(parsedJson)
    : String(raw || "").split(/\n+/);

  const items = sourceLines
    .flatMap((line) => String(line).split(/(?=\s[-*.\u2022]\s+)/g))
    .map((line) => ({
      marker: getExplainMarker(line),
      text: normalizeExplainLine(line),
    }))
    .filter((item) => item.text)
    .filter((item) => !/^[\[{ }"':,]+$/.test(item.text))
    .slice(0, maxItems);

  if (!items.length) return "- The article does not provide enough detail to explain further";

  return items.map((item) => {
    if (item.text.endsWith("?")) return item.text;
    if (item.marker === ".") return `. ${item.text}`;
    return `- ${item.text}`;
  }).join("\n");
}

export async function generateNewsAiSummary(articleId, { force = false } = {}) {
  const article = await getNewsArticleById(articleId);
  if (article.aiSummary && !force) return article;

  const rawSummary = await runNewsGroq({
    system:
      "You are an astronomy news editor. Summarize astronomy and space-related news accurately. Use ONLY the provided title and summary. Simple English. Max 80 words. Exactly 3 short lines. Do not use markdown syntax, headings, bold text, tables, or code blocks. If a list is useful, prefix each main line with '- '. Do not invent dates, causes, companies, outcomes, or background details. If the provided text lacks detail, say that the article does not provide enough detail.",
    user: `${buildArticleContext(article)}

Generate a concise summary.`,
    maxTokens: 220,
  });
  const aiSummary = formatPlainAiResponse(rawSummary, {
    maxLines: 3,
    fallback: "- The article does not provide enough detail.",
  });

  return prisma.newsArticle.update({
    where: { id: article.id },
    data: { aiSummary },
  });
}

export async function generateNewsImportance(articleId, { force = false } = {}) {
  const article = await getNewsArticleById(articleId);
  if (article.importance && !force) return article;

  const rawImportance = await runNewsGroq({
    system:
      "Explain why this astronomy news matters in under 60 words. Be factual. Return plain text only. Do not use markdown syntax, headings, bold text, tables, or code blocks. If a list is useful, prefix each main line with '- '.",
    user: buildArticleContext(article),
    maxTokens: 160,
  });
  const importance = formatPlainAiResponse(rawImportance, {
    maxLines: 4,
    fallback: "- The article does not provide enough detail.",
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
  const rawExplanation = await runNewsGroq({
    system:
      "You are an astronomy teacher. Explain astronomy news for beginners. Return plain text only. Do not return JSON. Do not use markdown syntax, headings, bold text, tables, or code blocks. Use this exact structure: question lines have no prefix and end with '?'; main idea lines start with '- '; sub-detail lines start with '. '. Keep punctuation light and avoid unnecessary periods.",
    user: `Explain this article.
${buildArticleContext(article)}`,
    maxTokens: 420,
    temperature: 0.4,
  });
  const explanation = formatStructuredExplanation(rawExplanation);

  return { articleId: article.id, explanation };
}

export async function answerNewsQuestion(articleId, question) {
  const article = await getNewsArticleById(articleId);
  const rawAnswer = await runNewsGroq({
    system:
      "Answer questions ONLY using the provided article. Return plain text only. Do not use markdown syntax, headings, bold text, tables, or code blocks. If a list is useful, prefix each main line with '- '. If insufficient information, reply: I don't have enough information in this article.",
    user: `Article:
${buildArticleContext(article)}

Question: ${question}`,
    maxTokens: 260,
    temperature: 0.2,
  });
  const answer = formatPlainAiResponse(rawAnswer, {
    maxLines: 6,
    fallback: "I don't have enough information in this article.",
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
          "You are an astronomy news editor. Summarize astronomy and space articles in clear, concise English for a general audience. Return plain text only. Do not use markdown syntax, headings, bold text, tables, or code blocks. If a list is useful, prefix each main line with '- '.",
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

  return formatPlainAiResponse(completion.choices?.[0]?.message?.content || "", {
    maxLines: 3,
    fallback: "- The article does not provide enough detail.",
  });
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
