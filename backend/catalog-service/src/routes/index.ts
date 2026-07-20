import { Router } from "express";
import categoryRoutes from "./category.routes";
import productRoutes from "./product.routes";
import variantRoutes from "./variant.routes";
import uploadRoutes from "./upload.routes";
import promotionRoutes from "./promotion.routes";

const router = Router();

router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/variants", variantRoutes);
router.use("/upload", uploadRoutes);
router.use("/promotions", promotionRoutes);

export default router;
