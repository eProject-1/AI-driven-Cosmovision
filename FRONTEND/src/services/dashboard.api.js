import { getData } from "./api.js";

export const getDashboardData = (params = {}) => getData("/dashboard-public", { params });
