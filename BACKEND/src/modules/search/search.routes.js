import { Router } from "express";
import { tryAuthenticate } from "../../middlewares/auth.middleware.js";
import { search, searchWithBody } from "./search.controller.js";

const router = Router();

router.use(tryAuthenticate);

// GET /api/search?q=show planets with rings&limit=5
router.get("/", search);

// POST /api/search
// Body: { "query": "best observatories near me", "lat": 21.02, "lon": 105.84 }
router.post("/", searchWithBody);

export default router;
