import { Router } from "express";
import { VisualController } from "../controllers/visual.controller";
import { uploadImageMiddleware } from "../middlewares/upload.middleware";

const router = Router();

// POST /api/search/visual (hoặc /search/visual)
router.post("/", uploadImageMiddleware, VisualController.searchByImage);

export default router;
