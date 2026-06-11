import api from "./api.js";

export const getPlanets = async () => {
  const { data } = await api.get("/astronomy/planets");
  return data.data;
};

export const getPlanetById = async (id) => {
  const { data } = await api.get(`/astronomy/planets/${id}`);
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