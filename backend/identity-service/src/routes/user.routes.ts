import { Router, RequestHandler } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/user.controller';
import { verifyToken } from '../middlewares/verifyToken';

const router = Router();

router.use(verifyToken as RequestHandler);

router.get('/profile', getProfile as RequestHandler);
router.put('/profile', updateProfile as RequestHandler);
router.patch('/change-password', changePassword as RequestHandler);

export default router;
