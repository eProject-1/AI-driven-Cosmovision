import api from "./api.js";

export const getCurrentUser = async () => {
  const { data } = await api.get("/user/me");
  return data.data;
};

export const getUserSummary = async () => {
  const { data } = await api.get("/user/summary");
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

export const addFavorite = async (type, slugOrName) => {
  const { data } = await api.post(`/user/favorites/${type}/${encodeURIComponent(slugOrName)}`);
  return data.data;
};

export const removeFavorite = async (type, slugOrName) => {
  const { data } = await api.delete(`/user/favorites/${type}/${encodeURIComponent(slugOrName)}`);
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

export const saveEvent = async (eventId) => {
  const { data } = await api.post(`/user/saved-events/${eventId}`);
  return data.data;
};

export const removeSavedEvent = async (eventId) => {
  const { data } = await api.delete(`/user/saved-events/${eventId}`);
  return data.data;
};

export const getSavedObservatories = async () => {
  const { data } = await api.get("/user/saved-observatories");
  return data.data;
};

export const getImageUploads = async (limit = 10) => {
  const { data } = await api.get("/user/image-uploads", { params: { limit } });
  return data.data;
};
