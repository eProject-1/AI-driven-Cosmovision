import api from "../utils/api";

export const getApod = async () => {
  const response = await api.get("/nasa/apod");
  return response.data;
};

export const getSpaceImages = async () => {
  const response = await api.get("/nasa/images");
  return response.data;
};