import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cosmovision_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthRequest = [
      "/auth/login",
      "/auth/register",
      "/auth/verify-email",
      "/auth/resend-verification",
    ].some((path) => requestUrl.includes(path));

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("cosmovision_token");
      localStorage.removeItem("cosmovision_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const unwrapData = async (request) => {
  const { data } = await request;
  return data.data;
};

export const getData = (url, config) => unwrapData(api.get(url, config));
export const postData = (url, body, config) => unwrapData(api.post(url, body, config));
export const patchData = (url, body, config) => unwrapData(api.patch(url, body, config));
export const deleteData = (url, config) => unwrapData(api.delete(url, config));

export default api;
