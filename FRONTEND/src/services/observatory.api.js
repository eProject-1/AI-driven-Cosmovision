import axios from "axios";
import { API_BASE_URL, getData, postData, unwrapData } from "./api.js";

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const getObservatories = (params = {}) => getData("/observatory", { params });

export const getObservatoryBySlug = (slug) => getData(`/observatory/${slug}`);

export const getNearbyObservatories = ({ lat, lon, radius = 100 }) =>
  getData("/observatory/nearby", {
    params: { lat, lon, radius, includeWeather: true },
  });

export const getObservatoryStats = (params = {}) =>
  unwrapData(publicApi.get("/observatory/stats", { params }));

export const toggleSaveObservatory = (id) => postData(`/observatory/${id}/save`);

export const getObservatoryPlans = ({ limit = 5 } = {}) =>
  getData("/observatory/plans", { params: { limit } });
