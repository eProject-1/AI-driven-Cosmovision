import { deleteData, getData, postData } from "./api.js";

export const getPlanets = () => getData("/astronomy/planets");

export const getConstellations = () => getData("/astronomy/constellations");

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
