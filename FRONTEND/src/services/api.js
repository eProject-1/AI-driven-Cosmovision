import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});

// Gắn token tự động
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cosmovision_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Xử lý 401 tự động logout
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("cosmovision_token");
      localStorage.removeItem("cosmovision_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
