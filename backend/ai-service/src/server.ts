import 'dotenv/config';
import app from './app';
import { prisma } from './config/prisma';
import { env } from './config/env';

const PORT = Number(env.PORT) || 3010;

async function bootstrap() {
  try {
    // 1. Thử kết nối database ai_db
    try {
      await prisma.$connect();
      console.log('✅ [AI Service] Database connected successfully (ai_db)');
    } catch (dbError: any) {
      console.warn('⚠️ [AI Service] Database server (localhost:5432) chưa bật.');
      console.warn('👉 Gợi ý: Hãy mở Docker Desktop và chạy: docker compose up -d postgres');
      console.warn('ℹ️ [AI Service] Server vẫn sẽ khởi động ở chế độ Standalone/In-Memory để bạn có thể test API & SSE ngay lập tức!\n');
    }

    // 2. Khởi động HTTP Server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 [AI Service] Server is running on http://localhost:${PORT}`);
      console.log(`📡 SSE Chat endpoint: http://localhost:${PORT}/api/ai/chat`);
      console.log(`🔍 RAG Query endpoint: http://localhost:${PORT}/api/ai/rag/query`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`\n[AI Service] Received ${signal}. Shutting down gracefully...`);
      try {
        await prisma.$disconnect();
      } catch {}
      server.close(() => {
        console.log('[AI Service] Closed all connections. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ [AI Service] Fatal error during bootstrap:', error);
    process.exit(1);
  }
}

bootstrap();
