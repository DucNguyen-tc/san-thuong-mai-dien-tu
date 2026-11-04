import { Router } from 'express';
import { streamChat, getChatHistory } from '../controllers/chat.controller';

const router = Router();

router.post('/chat', streamChat);
router.get('/sessions/:sessionToken/messages', getChatHistory);

export default router;

