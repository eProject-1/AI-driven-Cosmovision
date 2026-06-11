import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../../utils/response.util.js";
import * as service from "./astronomy.service.js";

export const getPlanets = asyncHandler(async (req, res) => {
  const planets = await service.getAllPlanets();
  return sendSuccess(res, planets);
});

export const getPlanetById = asyncHandler(async (req, res) => {
  const planet = await service.getPlanetById(req.params.id);
  if (!planet) return sendError(res, "Không tìm thấy hành tinh", 404);
  return sendSuccess(res, planet);
});

export const getConstellations = asyncHandler(async (req, res) => {
  const constellations = await service.getAllConstellations();
  return sendSuccess(res, constellations);
});

export const getConstellationById = asyncHandler(async (req, res) => {
  const constellation = await service.getConstellationById(req.params.id);
  if (!constellation) return sendError(res, "Không tìm thấy chòm sao", 404);
  return sendSuccess(res, constellation);
});