import { Router, RequestHandler } from 'express';
import { getNotificationLogs } from '../controllers/notification.controller';
import { verifyToken, requireAdmin } from '../middlewares/verifyToken';

const router = Router();

// Yêu cầu đăng nhập và quyền Admin cho tất cả các route bên dưới
router.use(verifyToken as RequestHandler);
router.use(requireAdmin as RequestHandler);

router.get('/', getNotificationLogs as RequestHandler);

export default router;
