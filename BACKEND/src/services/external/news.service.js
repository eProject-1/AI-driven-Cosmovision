import axios from "axios";
import { createLogger } from "../../utils/logger.util.js";

const SPACEFLIGHT_NEWS_API_BASE_URL = "https://api.spaceflightnewsapi.net/v4";
const DEFAULT_SPACE_QUERY = "space";
const logger = createLogger("external-news");

function normalizeArticle(article = {}) {
  return {
    id: article.id,
    title: article.title || "Untitled article",
    source: article.news_site || article.source || "Spaceflight News",
    author: article.authors?.map((author) => author.name).filter(Boolean).join(", ") || null,
    description: article.summary || article.description || null,
    url: article.url,
    imageUrl: article.image_url || article.imageUrl || null,
    publishedAt: article.published_at || article.publishedAt || null,
    content: article.summary || article.content || null,
    featured: article.featured || false,
  };
}

function buildSearchQuery(query) {
  if (!query || typeof query !== "string") return "";

  return query
    .replace(/\s+OR\s+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchAstronomyNews({
  query = DEFAULT_SPACE_QUERY,
  pageSize = 10,
  page = 1,
} = {}) {
  try {
    const params = {
      limit: Number(pageSize),
      offset: Math.max(0, (Number(page) - 1) * Number(pageSize)),
    };
    const searchQuery = buildSearchQuery(query);
    if (searchQuery) params.search = searchQuery;

    const response = await axios.get(`${SPACEFLIGHT_NEWS_API_BASE_URL}/articles/`, { params });
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
    logger.error("Fetch astronomy news failed", error.response?.data || error);

    return {
      success: false,
      message: "Failed to fetch astronomy news.",
      error: error.response?.data?.message || error.message,
      data: [],
    };
  }
}

export function fetchNasaNews({ pageSize = 10, page = 1 } = {}) {
  return fetchAstronomyNews({ query: "NASA", pageSize, page });
}

export function fetchExoplanetNews({ pageSize = 10, page = 1 } = {}) {
  return fetchAstronomyNews({ query: "exoplanet", pageSize, page });
}
