/**
 * news.service.js
 * - Gọi Spaceflight News API.
 * - Lấy thông tin bài báo từ bên ngoài.
 * - Tóm tắt cho người dùng đọc.
 */

import axios from "axios";

const SPACEFLIGHT_NEWS_API_BASE_URL = "https://api.spaceflightnewsapi.net/v4";
const DEFAULT_SPACE_QUERY = "space";

function normalizeArticle(article = {}) {
  return {
    id: article.id,
    title: article.title || "Untitled article",
    source: article.news_site || article.source || "Spaceflight News",
    author:
      article.authors?.map((author) => author.name).filter(Boolean).join(", ") || null,
    description: article.summary || article.description || null,
    url: article.url,
    imageUrl: article.image_url || article.imageUrl || null,
    publishedAt: article.published_at || article.publishedAt || null,
    content: article.summary || article.content || null,
    featured: article.featured || false,
  };
}

function buildSimpleSummary(article) {
  const title = article.title || "Untitled article";
  const source = article.source || "Unknown source";
  const description = article.description || "No description available.";

  return `${title} — ${description} Source: ${source}.`;
}

function buildSearchQuery(query) {
  if (!query || typeof query !== "string") return "";

  return query
    .replace(/\s+OR\s+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAstronomyNews({
  query = DEFAULT_SPACE_QUERY,
  pageSize = 10,
  page = 1,
  language = "en",
  sortBy = "publishedAt",
} = {}) {
  try {
    const params = {
      limit: Number(pageSize),
      offset: Math.max(0, (Number(page) - 1) * Number(pageSize)),
    };

    const searchQuery = buildSearchQuery(query);
    if (searchQuery) params.search = searchQuery;

    const response = await axios.get(`${SPACEFLIGHT_NEWS_API_BASE_URL}/articles/`, {
      params,
    });

    const articles = Array.isArray(response.data?.results)
      ? response.data.results.map(normalizeArticle)
      : [];

    return {
      success: true,
      message: "Astronomy news fetched successfully.",
      totalResults: response.data?.count || articles.length,
      count: articles.length,
      data: articles,
    };
  } catch (error) {
    console.error("Fetch astronomy news error:", error.response?.data || error.message);

    return {
      success: false,
      message: "Failed to fetch astronomy news.",
      error: error.response?.data?.message || error.message,
      data: [],
    };
  }
}

async function fetchNasaNews({ pageSize = 10, page = 1 } = {}) {
  return fetchAstronomyNews({
    query: "NASA",
    pageSize,
    page,
    language: "en",
    sortBy: "publishedAt",
  });
}

async function fetchExoplanetNews({ pageSize = 10, page = 1 } = {}) {
  return fetchAstronomyNews({
    query: "exoplanet",
    pageSize,
    page,
    language: "en",
    sortBy: "publishedAt",
  });
}

async function summarizeNewsForDashboard({
  query = DEFAULT_SPACE_QUERY,
  pageSize = 6,
} = {}) {
  try {
    const result = await fetchAstronomyNews({
      query,
      pageSize,
      page: 1,
      language: "en",
      sortBy: "publishedAt",
    });

    if (!result.success) {
      return result;
    }

    const summarizedArticles = result.data.map((article) => ({
      ...article,
      summary: buildSimpleSummary(article),
    }));

    return {
      success: true,
      message: "Dashboard news summary generated successfully.",
      count: summarizedArticles.length,
      data: {
        latestArticles: summarizedArticles,
        highlights: summarizedArticles.slice(0, 3).map((article) => ({
          title: article.title,
          source: article.source,
          summary: article.summary,
          url: article.url,
          publishedAt: article.publishedAt,
        })),
      },
    };
  } catch (error) {
    console.error("Summarize news for dashboard error:", error.message);

    return {
      success: false,
      message: "Failed to summarize news for dashboard.",
      error: error.message,
      data: {
        latestArticles: [],
        highlights: [],
      },
    };
  }
}

export {
  fetchAstronomyNews,
  fetchNasaNews,
  fetchExoplanetNews,
  summarizeNewsForDashboard,
};
