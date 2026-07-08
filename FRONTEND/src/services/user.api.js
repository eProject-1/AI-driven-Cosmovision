import { deleteData, getData, patchData, postData } from "./api.js";

export const getUserSummary = () => getData("/user/summary");

export const updateProfile = (payload) => patchData("/user/profile", payload);

export const updatePreferences = (payload) => patchData("/user/preferences", payload);

export const addFavorite = (type, slugOrName) =>
  postData(`/user/favorites/${type}/${encodeURIComponent(slugOrName)}`);

export const removeFavorite = (type, slugOrName) =>
  deleteData(`/user/favorites/${type}/${encodeURIComponent(slugOrName)}`);

export const getRecommendations = (limit = 5) =>
  getData("/user/recommendations", { params: { limit } });

export const getSavedEvents = () => getData("/user/saved-events");

export const saveEvent = (eventId) => postData(`/user/saved-events/${eventId}`);

export const removeSavedEvent = (eventId) => deleteData(`/user/saved-events/${eventId}`);

export const getSavedObservatories = () => getData("/user/saved-observatories");

export const getImageUploads = (limit = 10) => getData("/user/image-uploads", { params: { limit } });
