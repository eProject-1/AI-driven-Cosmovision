import api from "./api.js";

export const getPlanetBySlug = async (slug) => {
  const { data } = await api.get(`/astronomy/planets/${slug}`);
  return data.data;
};
