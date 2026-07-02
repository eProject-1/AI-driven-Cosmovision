import api from "./api.js";

export const createRecommendation = async ({ latitude, longitude, locationName }) => {
  const { data } = await api.post("/recommendations", {
    latitude,
    longitude,
    ...(locationName ? { locationName } : {}),
  });

  return data.data;
};

export const getRecommendationHistory = async ({ limit = 5 } = {}) => {
  const { data } = await api.get("/recommendations", { params: { limit } });
  return data.data;
};

export const refreshRecommendation = async (id) => {
  const { data } = await api.post(`/recommendations/${id}/refresh`);
  return data.data;
};
