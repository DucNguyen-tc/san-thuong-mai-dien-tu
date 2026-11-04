import { Router } from 'express';
import { queryRag } from '../controllers/rag.controller';

const router = Router();

router.post('/query', queryRag);

export default router;

