import { Router } from 'express';
import { telegramController } from '../controllers/telegram.controller';

const router = Router();

// GET /api/telegram/status - Kiểm tra trạng thái Bot, Cron, Chat ID
router.get('/status', telegramController.getStatus.bind(telegramController));

// GET /api/telegram/preview-report - Xem trước báo cáo ngày (không gửi tin)
router.get('/preview-report', telegramController.previewReport.bind(telegramController));

// POST /api/telegram/send-report - Gửi báo cáo doanh thu tức thời
router.post('/send-report', telegramController.sendReport.bind(telegramController));

// POST /api/telegram/test-alert - Bắn thử cảnh báo sự cố khẩn cấp
router.post('/test-alert', telegramController.testAlert.bind(telegramController));

export default router;
