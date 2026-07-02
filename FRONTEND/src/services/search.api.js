import api from "./api.js";

export const smartSearch = async ({ query, limit = 6, lat, lon } = {}) => {
  const { data } = await api.get("/search", {
    params: {
      q: query,
      limit,
      ...(lat != null ? { lat } : {}),
      ...(lon != null ? { lon } : {}),
    },
  });

  return data.data;
};
