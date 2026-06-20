import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../../middlewares/role.middleware.js";
import {
  getAllPlanets,
  getPlanetBySlug,
  getPlanetFacts,
  refreshPlanetFacts,
  getRelatedPlanet,
} from "./planet.controller.js";

const router = Router();

// Public routes
router.get("/", getAllPlanets); // Danh sách hành tinh
router.get("/:slug/facts", getPlanetFacts); // AI Interesting Facts
router.get("/:slug/related", getRelatedPlanet); // Related planets
router.get("/:slug", getPlanetBySlug); // Chi tiết hành tinh

router.post(
  "/:slug/facts/refresh",
  authenticate,
  roleMiddleware("ADMIN"),
  refreshPlanetFacts
);


export default router;

