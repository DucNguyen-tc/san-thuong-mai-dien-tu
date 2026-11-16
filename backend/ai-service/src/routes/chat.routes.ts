import { Router } from 'express';
import { streamChat, getChatHistory } from '../controllers/chat.controller';
import { chatRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/chat', chatRateLimiter, streamChat);
router.get('/sessions/:sessionToken/messages', getChatHistory);

export default router;

