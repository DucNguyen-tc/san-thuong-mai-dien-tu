import { Router } from "express";
import searchRoutes from "./search.routes";
import visualRoutes from "./visual.routes";

const router = Router();

// Mount visual search endpoints
router.use("/search/visual", visualRoutes);

// Mount search endpoints
router.use("/search", searchRoutes);

export default router;
