import api from "./api.js";
import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

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
    params: { lat, lon, radius, includeWeather: true },
  });
  return data.data;
};

export const getObservatoryStats = async (params = {}) => {
  const { data } = await publicApi.get("/observatory/stats", { params });
  return data.data;
};

export const toggleSaveObservatory = async (id) => {
  const { data } = await api.post(`/observatory/${id}/save`);
  return data.data;
};

export const removeSavedObservatory = async (id) => {
  const { data } = await api.delete(`/observatory/${id}/save`);
  return data.data;
};
