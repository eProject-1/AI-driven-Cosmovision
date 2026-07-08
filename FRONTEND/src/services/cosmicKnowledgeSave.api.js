import api from "./api.js";

const STORAGE_KEY = "cosmovision_saved_cosmic_knowledge";

function getCurrentUserKey() {
  if (typeof window === "undefined") return "anonymous";

  try {
    const storedUser = JSON.parse(window.localStorage.getItem("cosmovision_user") || "null");
    if (storedUser?.id) return storedUser.id;
    if (storedUser?.email) return storedUser.email;
  } catch {
    // Ignore malformed local storage.
  }

  const token = window.localStorage.getItem("cosmovision_token");
  return token ? `token:${token.slice(-18)}` : "anonymous";
}

function readLocalSaved() {
  if (typeof window === "undefined") return [];

  try {
    const allSaved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    const items = allSaved[getCurrentUserKey()];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeLocalSaved(items) {
  if (typeof window === "undefined") return;

  try {
    const allSaved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    allSaved[getCurrentUserKey()] = items;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allSaved));
  } catch {
    // Ignore storage quota and privacy mode errors.
  }
}

export function getLocalSavedCosmicKnowledgeItems() {
  return readLocalSaved();
}

export async function getSavedCosmicKnowledge() {
  const localItems = readLocalSaved();

  try {
    const { data } = await api.get("/cosmic-knowledge-notes/saved");
    const apiSlugs = data?.data?.slugs || [];
    const localSlugs = localItems.map((item) => item.slug);
    return {
      ...data,
      data: {
        ...(data?.data || {}),
        slugs: Array.from(new Set([...apiSlugs, ...localSlugs])),
        items: localItems,
      },
    };
  } catch (error) {
    if (error?.response?.status === 401) throw error;
    return {
      success: true,
      data: {
        slugs: localItems.map((item) => item.slug),
        items: localItems,
      },
    };
  }
}

export async function saveCosmicKnowledge(slug, details = {}) {
  const safeSlug = String(slug || "");
  if (!safeSlug) return { success: false, data: { saved: false } };

  const current = readLocalSaved();
  const nextItem = {
    slug: safeSlug,
    title: details.title || safeSlug,
    category: details.category || "Cosmic Knowledge",
    imageUrl: details.imageUrl || details.imageSrc || "",
    savedAt: new Date().toISOString(),
  };

  writeLocalSaved([nextItem, ...current.filter((item) => item.slug !== safeSlug)]);

  try {
    const { data } = await api.post(`/cosmic-knowledge-notes/${safeSlug}/save`);
    return data;
  } catch (error) {
    if (error?.response?.status === 401) throw error;
    return { success: true, data: { saved: true, slug: safeSlug, local: true } };
  }
}

export async function unsaveCosmicKnowledge(slug) {
  const safeSlug = String(slug || "");
  writeLocalSaved(readLocalSaved().filter((item) => item.slug !== safeSlug));

  try {
    const { data } = await api.delete(`/cosmic-knowledge-notes/${safeSlug}/save`);
    return data;
  } catch (error) {
    if (error?.response?.status === 401) throw error;
    return { success: true, data: { saved: false, slug: safeSlug, local: true } };
  }
}
