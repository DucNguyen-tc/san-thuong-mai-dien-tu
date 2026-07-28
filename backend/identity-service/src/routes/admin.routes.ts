import { Router, RequestHandler } from 'express';
import { getAllUsers, toggleUserActive, createUser, updateUser } from '../controllers/admin.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { verifyToken, requireAdmin } from '../middlewares/verifyToken';

const dashboardController = new DashboardController();

const router = Router();

// Protect all admin routes
router.use(verifyToken as RequestHandler, requireAdmin as RequestHandler);

router.get('/users', getAllUsers as RequestHandler);
router.post('/users', createUser as RequestHandler);
router.put('/users/:id', updateUser as RequestHandler);
router.patch('/users/:id/toggle-active', toggleUserActive as RequestHandler);
router.get('/dashboard/stats', dashboardController.getDashboardStats.bind(dashboardController) as RequestHandler);

export default router;
