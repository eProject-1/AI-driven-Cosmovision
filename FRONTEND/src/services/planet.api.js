import { getData } from "./api.js";

export const getPlanetBySlug = (slug) => getData(`/astronomy/planets/${slug}`);
