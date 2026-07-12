import { deleteData, getData, postData } from "./api.js";

export const getPlanets = () => getData("/astronomy/planets");

const CONSTELLATION_PAGE_SIZE = 50;

function normalizeConstellationList(data) {
  if (Array.isArray(data)) return { items: data, pagination: null };
  return {
    items: Array.isArray(data?.constellations) ? data.constellations : [],
    pagination: data?.pagination || null,
  };
}

export const getConstellations = async () => {
  const firstPage = normalizeConstellationList(
    await getData("/astronomy/constellations", { params: { page: 1, limit: CONSTELLATION_PAGE_SIZE } })
  );

  const totalPages = firstPage.pagination?.totalPages || 1;
  if (totalPages <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getData("/astronomy/constellations", {
        params: { page: index + 2, limit: CONSTELLATION_PAGE_SIZE },
      }).then((data) => normalizeConstellationList(data).items)
    )
  );

  return [firstPage.items, ...remainingPages].flat();
};

export const getConstellationsByMonth = (month) => getData(`/astronomy/constellations/month/${month}`);

export const getConstellationBySlug = (slug) => getData(`/astronomy/constellations/${slug}`);

export const getConstellationAIContent = (slug) => getData(`/astronomy/constellations/${slug}/ai-content`);

export const refreshConstellationAIContent = (slug) =>
  postData(`/astronomy/constellations/${slug}/ai-content/refresh`);

export const getConstellationGallery = (slug, { limit = 15 } = {}) =>
  getData(`/astronomy/constellations/${slug}/gallery`, { params: { limit } });

export const getRelatedConstellations = (slug) => getData(`/astronomy/constellations/${slug}/related`);

export const recognizeConstellationImage = async ({ image, hint }) => {
  const formData = new FormData();
  formData.append("image", image);
  if (hint?.trim()) formData.append("hint", hint.trim());

  return postData("/astronomy/constellations/recognize", formData, { timeout: 60000 });
};

export const getMyConstellationUploads = ({ limit = 6 } = {}) =>
  getData("/astronomy/constellations/uploads/me", { params: { limit } });

export const deleteConstellationUpload = (uploadId) =>
  deleteData(`/astronomy/constellations/uploads/${uploadId}`);
