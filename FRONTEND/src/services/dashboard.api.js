import api from "./api.js";

export const getDashboardData = async (params = {}) => {
  const { data } = await api.get("/dashboard-public", { params });
  return data.data;
};
