import { Router } from "express";
import { SearchController } from "../controllers/search.controller";
import { VisualController } from "../controllers/visual.controller";
import { uploadImageMiddleware } from "../middlewares/upload.middleware";

const router = Router();

// GET /api/search/products
router.get("/products", SearchController.searchProducts);

// GET /api/search/suggest
router.get("/suggest", SearchController.suggest);

// POST /api/search/visual
router.post("/visual", uploadImageMiddleware, VisualController.searchByImage);

export default router;
