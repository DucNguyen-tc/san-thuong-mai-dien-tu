import { Router, RequestHandler } from "express";
import {
  getTemplates,
  updateTemplate,
} from "../controllers/notification-template.controller";
import { validateBody } from "../middlewares/validate";
import { updateTemplateSchema } from "../schemas/notification.schema";
import { verifyToken, requireAdmin } from "../middlewares/verifyToken";

const router = Router();

// Yêu cầu đăng nhập và quyền Admin cho tất cả các route bên dưới
router.use(verifyToken as RequestHandler);
router.use(requireAdmin as RequestHandler);

router.get("/", getTemplates as RequestHandler);
router.put(
  "/:code",
  validateBody(updateTemplateSchema) as RequestHandler,
  updateTemplate as RequestHandler,
);

export default router;
