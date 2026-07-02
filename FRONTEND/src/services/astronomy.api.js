import api from "./api.js";

export const getPlanets = async () => {
  const { data } = await api.get("/astronomy/planets");
  return data.data;
};

export const getPlanetById = async (id) => {
  const { data } = await api.get(`/astronomy/planets/${id}`);
  return data.data;
};

export const getPlanetFacts = async (slug) => {
  const { data } = await api.get(`/astronomy/planets/${slug}/facts`);
  return data.data;
};

export const getRelatedPlanets = async (slug) => {
  const { data } = await api.get(`/astronomy/planets/${slug}/related`);
  return data.data;
};

export const getConstellations = async () => {
  const { data } = await api.get("/astronomy/constellations");
  return data.data;
};

export const getConstellationById = async (id) => {
  const { data } = await api.get(`/astronomy/constellations/${id}`);
  return data.data;
};

export const recognizeConstellationImage = async ({ image, hint }) => {
  const formData = new FormData();
  formData.append("image", image);
  if (hint?.trim()) formData.append("hint", hint.trim());

  const { data } = await api.post("/astronomy/constellations/recognize", formData);
  return data.data;
};

export const getMyConstellationUploads = async ({ limit = 6 } = {}) => {
  const { data } = await api.get("/astronomy/constellations/uploads/me", {
    params: { limit },
  });
  return data.data;
};

export const deleteConstellationUpload = async (uploadId) => {
  const { data } = await api.delete(`/astronomy/constellations/uploads/${uploadId}`);
  return data.data;
};
