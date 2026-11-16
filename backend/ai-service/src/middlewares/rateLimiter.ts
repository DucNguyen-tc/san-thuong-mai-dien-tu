import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

/**
 * In-memory sliding window rate limiter để bảo vệ chat API khỏi spam / ddos / cạn kiệt LLM quota
 */
export function createRateLimiter(options?: RateLimitOptions) {
  const windowMs = options?.windowMs || 60 * 1000;
  const maxRequests = options?.max || 30;
  const message = options?.message || 'Bạn đang gửi quá nhiều tin nhắn trong thời gian ngắn. Vui lòng thử lại sau một lát nhé!';

  const store = new Map<string, RateLimitRecord>();

  // Tự động dọn dẹp các record hết hạn mỗi 60 giây
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 60 * 1000);

  cleanupTimer.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId =
      (req.headers['x-user-id'] as string) ||
      (req.body?.session_token as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown-client';

    const now = Date.now();
    let record = store.get(clientId);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(clientId, record);
      return next();
    }

    if (record.count >= maxRequests) {
      const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', remainingSeconds);

      if (req.headers.accept?.includes('text/event-stream')) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ message: `${message} (Vui lòng đợi ${remainingSeconds} giây)` })}\n\n`);
        res.end();
        return;
      }

      res.status(429).json({
        success: false,
        message: `${message} (Vui lòng thử lại sau ${remainingSeconds} giây)`,
        retry_after_seconds: remainingSeconds,
      });
      return;
    }

    record.count++;
    next();
  };
}

export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30, // 30 requests / phút
  message: 'Bạn đang gửi tin nhắn quá nhanh.',
});
