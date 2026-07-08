import { postData } from "./api.js";

const recommendationTimeout = { timeout: 60000 };

export const createRecommendation = ({ latitude, longitude, locationName }) =>
  postData(
    "/recommendations",
    {
      ...(Number.isFinite(Number(latitude)) ? { latitude: Number(latitude) } : {}),
      ...(Number.isFinite(Number(longitude)) ? { longitude: Number(longitude) } : {}),
      ...(locationName ? { locationName } : {}),
    },
    recommendationTimeout
  );

export const refreshRecommendation = (id) =>
  postData(`/recommendations/${id}/refresh`, undefined, recommendationTimeout);
