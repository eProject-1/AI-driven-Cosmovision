import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../../middlewares/role.middleware.js";
import {
  createPlanet,
  deletePlanet,
  getAllPlanets,
  getPlanetBySlug,
  getPlanetFacts,
  getRelatedPlanet,
  refreshPlanetFacts,
  updatePlanet,
} from "./planet.controller.js";

const router = Router();
const adminOnly = [authenticate, roleMiddleware("ADMIN")];

router.get("/", getAllPlanets);
router.post("/", ...adminOnly, createPlanet);

router.get("/:slug/facts", getPlanetFacts);
router.post("/:slug/facts/refresh", ...adminOnly, refreshPlanetFacts);

router.get("/:slug/related", getRelatedPlanet);
router.get("/:slug", getPlanetBySlug);
router.patch("/:slug", ...adminOnly, updatePlanet);
router.delete("/:slug", ...adminOnly, deletePlanet);

export default router;
