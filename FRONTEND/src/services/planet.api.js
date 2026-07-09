import { getData, postData } from "./api.js";

export const getPlanetBySlug = (slug) => getData(`/astronomy/planets/${slug}`);
export const getPlanetFacts = (slug) => getData(`/astronomy/planets/${slug}/facts`);
export const refreshPlanetFacts = (slug) => postData(`/astronomy/planets/${slug}/facts/refresh`);
