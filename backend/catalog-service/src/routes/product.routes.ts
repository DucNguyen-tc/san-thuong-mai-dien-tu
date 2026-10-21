import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductPricesBatch,
} from "../controllers/product.controller";
import { validateBody } from "../middlewares/validate";
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from "../schemas/product.schema";

// TODO (tuần 2+): gắn middleware verifyToken + requireRole('ADMIN') của Identity Service
// cho các route create/update/delete bên dưới.

const router = Router();

router.get("/", getProducts);
// QUAN TRỌNG: route tĩnh /internal/prices phải đặt TRƯỚC /:id
router.post("/internal/prices", getProductPricesBatch);
router.get("/:id", getProductById);
router.post("/", validateBody(createProductSchema), createProduct);
router.put("/:id", validateBody(updateProductSchema), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
