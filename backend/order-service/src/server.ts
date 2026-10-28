import 'dotenv/config';
import app from './app';
import { prisma } from './config/prisma';
import { rabbitMQPublisher } from './rabbitmq/publisher';
import { dailyReportCron } from './cron/daily-report.cron';
import { telegramBotService } from './services/telegram-bot.service';

const PORT = process.env.PORT || 3004;

async function bootstrap() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connected successfully');

    // Connect to RabbitMQ
    await rabbitMQPublisher.connect();

    // Khởi động lịch trình gửi báo cáo tự động 23:00 hàng ngày
    dailyReportCron.start();

    // Khởi động trợ lý Telegram Bot nhận lệnh tương tác 2 chiều (Long-polling)
    telegramBotService.start().catch((err: any) => {
      console.warn('[Bootstrap] Không thể khởi động Telegram Bot polling:', err.message);
    });

    const server = app.listen(PORT, () => {
      console.log(`Order Service is running on port ${PORT}`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`\n[Server] Nhận tín hiệu ${signal}. Đang tắt dịch vụ an toàn...`);
      dailyReportCron.stop();
      telegramBotService.stop();
      await prisma.$disconnect();
      server.close(() => {
        console.log('[Server] Đã đóng tất cả kết nối. Tiến trình kết thúc.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

