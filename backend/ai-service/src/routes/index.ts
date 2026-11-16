import { Router } from 'express';
import chatRoutes from './chat.routes';
import ragRoutes from './rag.routes';

const router = Router();

// Mount endpoints: /api/ai/...
router.use('/', chatRoutes);
router.use('/rag', ragRoutes);

export default router;

