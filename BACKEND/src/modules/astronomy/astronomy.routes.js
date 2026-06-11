import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as controller from "./astronomy.controller.js";

const router = Router();

// Public routes
router.get("/planets", controller.getPlanets);
router.get("/planets/:id", controller.getPlanetById);
router.get("/constellations", controller.getConstellations);
router.get("/constellations/:id", controller.getConstellationById);

export default router;