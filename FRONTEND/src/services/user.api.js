import api from "./api.js";

export const getCurrentUser = async () => {
  const { data } = await api.get("/user/me");
  return data.data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.patch("/user/profile", payload);
  return data.data;
};

export const updatePreferences = async (payload) => {
  const { data } = await api.patch("/user/preferences", payload);
  return data.data;
};

export const getRecommendations = async (limit = 5) => {
  const { data } = await api.get("/user/recommendations", { params: { limit } });
  return data.data;
};

export const getSavedEvents = async () => {
  const { data } = await api.get("/user/saved-events");
  return data.data;
};

export const getSavedObservatories = async () => {
  const { data } = await api.get("/user/saved-observatories");
  return data.data;
};
