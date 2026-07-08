import { Router } from "express";
import { authenticate, tryAuthenticate } from "../../middlewares/auth.middleware.js";
import { roleMiddleware } from "../../middlewares/role.middleware.js";
import {
  create,
  getAll,
  getBySlug,
  getNearby,
  getPlans,
  getStats,
  remove,
  toggleSave,
  update,
} from "./observatory.controller.js";

const router = Router();
const adminOnly = [authenticate, roleMiddleware("ADMIN")];

router.get("/", getAll);
router.post("/", ...adminOnly, create);

// Static routes must stay before /:slug.
router.get("/nearby", getNearby);
router.get("/stats", getStats);
router.get("/plans", authenticate, getPlans);

router.get("/:slug", tryAuthenticate, getBySlug);
router.patch("/:slug", ...adminOnly, update);
router.delete("/:slug", ...adminOnly, remove);

router.post("/:id/save", authenticate, toggleSave);

export default router;
