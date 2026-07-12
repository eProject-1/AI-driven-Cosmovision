import { asyncHandler } from "../../../utils/controller.helpers.util.js";
import { sendSuccess } from "../../../utils/controller.helpers.util.js";
import {
  createPlanet as createPlanetRecord,
  deletePlanet as deletePlanetRecord,
  getAllPlanets as fetchAllPlanets,
  getPlanetBySlug as fetchPlanetBySlug,
  getPlanetFacts as fetchPlanetFacts,
  getRelatedPlanets,
  refreshPlanetFacts as refreshPlanetFactsRecord,
  updatePlanet as updatePlanetRecord,
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
  const data = await fetchPlanetFacts(req.params.slug);
  return sendSuccess(res, data);
});

export const refreshPlanetFacts = asyncHandler(async (req, res) => {
  const data = await refreshPlanetFactsRecord(req.params.slug);
  return sendSuccess(res, data, "Facts refreshed successfully");
});

export const getRelatedPlanet = asyncHandler(async (req, res) => {
  const related = await getRelatedPlanets(req.params.slug);
  return sendSuccess(res, related);
});

export const createPlanet = asyncHandler(async (req, res) => {
  const data = await createPlanetRecord(req.body);
  return sendSuccess(res, data, "Planet created successfully", 201);
});

export const updatePlanet = asyncHandler(async (req, res) => {
  const data = await updatePlanetRecord(req.params.slug, req.body);
  return sendSuccess(res, data, "Planet updated successfully");
});

export const deletePlanet = asyncHandler(async (req, res) => {
  const data = await deletePlanetRecord(req.params.slug);
  return sendSuccess(res, data, "Planet deleted successfully");
});
