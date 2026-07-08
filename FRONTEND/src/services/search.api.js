import { getData } from "./api.js";

export const smartSearch = ({ query, limit = 6, lat, lon } = {}) =>
  getData("/search", {
    params: {
      q: query,
      limit,
      ...(lat != null ? { lat } : {}),
      ...(lon != null ? { lon } : {}),
    },
  });
