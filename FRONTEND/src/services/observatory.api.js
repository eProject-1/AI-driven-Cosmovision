import api from "./api.js";

export const getObservatories = async (params = {}) => {
  const { data } = await api.get("/observatory", { params });
  return data.data;
};

export const getObservatoryBySlug = async (slug) => {
  const { data } = await api.get(`/observatory/${slug}`);
  return data.data;
};

export const getNearbyObservatories = async ({ lat, lon, radius = 100 }) => {
  const { data } = await api.get("/observatory/nearby", {
    params: { lat, lon, radius },
  });
  return data.data;
};

export const toggleSaveObservatory = async (id) => {
  const { data } = await api.post(`/observatory/${id}/save`);
  return data.data;
};
