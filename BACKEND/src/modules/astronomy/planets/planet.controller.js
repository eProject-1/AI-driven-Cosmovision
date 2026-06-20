import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/response.util.js";
import {
  getAllPlanets as fetchAllPlanets,
  getPlanetBySlug as fetchPlanetBySlug,
  getPlanetFacts as fetchPlanetFacts,
  getRelatedPlanets,
} from "./planet.service.js";

export const getAllPlanets = asyncHandler(async (req, res) => {
  const planets = await fetchAllPlanets();
  return sendSuccess(res, planets);
});

export const getPlanetBySlug = asyncHandler(async (req, res) => {
  const planet = await fetchPlanetBySlug(req.params.slug);
  return sendSuccess(res, planet);
});

export const getPlanetFacts = asyncHandler(async (req, res) => {
  const refresh = req.query.refresh === "true" && req.user?.role === "ADMIN";
  const data = await fetchPlanetFacts(req.params.slug, { refresh });
  return sendSuccess(res, data);
});

export const refreshPlanetFacts = asyncHandler(async (req, res) => {
  const data = await fetchPlanetFacts(req.params.slug, { refresh: true });
  return sendSuccess(res, data, "Facts refreshed successfully");
});

export const getRelatedPlanet = asyncHandler(async (req, res) => {
  const related = await getRelatedPlanets(req.params.slug);
  return sendSuccess(res, related);
});