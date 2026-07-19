import { Router, RequestHandler } from 'express';
import { getAllUsers, toggleUserActive } from '../controllers/admin.controller';
import { verifyToken, requireAdmin } from '../middlewares/verifyToken';

const router = Router();

// Protect all admin routes
router.use(verifyToken as RequestHandler, requireAdmin as RequestHandler);

router.get('/users', getAllUsers as RequestHandler);
router.patch('/users/:id/toggle-active', toggleUserActive as RequestHandler);

export default router;
