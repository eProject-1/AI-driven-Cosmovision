import api from "./api.js";

export const createRecommendation = async ({ latitude, longitude, locationName }) => {
  const { data } = await api.post("/recommendations", {
    ...(Number.isFinite(Number(latitude)) ? { latitude: Number(latitude) } : {}),
    ...(Number.isFinite(Number(longitude)) ? { longitude: Number(longitude) } : {}),
    ...(locationName ? { locationName } : {}),
  }, {
    timeout: 60000,
  });

  return data.data;
};

export const getRecommendationHistory = async ({ limit = 5 } = {}) => {
  const { data } = await api.get("/recommendations", { params: { limit } });
  return data.data;
};

export const refreshRecommendation = async (id) => {
  const { data } = await api.post(`/recommendations/${id}/refresh`, undefined, {
    timeout: 60000,
  });
  return data.data;
};
