import api from "./api.js";

const NEWS_CACHE_KEY = "cosmovision_news_cache";
const NEWS_CACHE_TTL_MS = 1000 * 60 * 5;

function buildCacheKey(params = {}) {
  const { page = 1, limit = 8, category = "", search = "" } = params;
  return JSON.stringify({ page, limit, category, search });
}

function readCache(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(NEWS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const entry = parsed[key];

    if (!entry) return null;
    if (Date.now() - entry.savedAt > NEWS_CACHE_TTL_MS) return null;

    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(NEWS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[key] = { savedAt: Date.now(), data };
    window.localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage errors
  }
}

export const getNewsList = async (params = {}, options = {}) => {
  const key = buildCacheKey(params);
  const cached = options.skipCache ? null : readCache(key);
  if (cached) return cached;

  const { data } = await api.get("/news", { params });
  const result = data.data;
  writeCache(key, result);
  return result;
};

export const getDashboardHighlights = async (limit = 5) => {
  const { data } = await api.get("/news/dashboard/highlights", { params: { limit } });
  return data.data;
};
