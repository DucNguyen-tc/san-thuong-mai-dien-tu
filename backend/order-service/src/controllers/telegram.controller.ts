import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { telegramAlertService } from '../services/telegram-alert.service';
import { telegramBotService } from '../services/telegram-bot.service';
import { dailyReportCron } from '../cron/daily-report.cron';
import { telegramUtil } from '../utils/telegram.util';

export class TelegramController {
  /**
   * GET /api/telegram/status
   * Lấy trạng thái hoạt động của Telegram Bot và Cron Job
   */
  public async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const isConfigured = telegramUtil.isConfigured();
      let botInfo = null;

      if (isConfigured) {
        botInfo = await telegramUtil.getMe();
      }

      const botServiceStatus = telegramBotService.getStatus();
      const cronStatus = dailyReportCron.getStatus();

      res.status(200).json({
        success: true,
        message: 'Lấy trạng thái Telegram module thành công',
        data: {
          isConfigured,
          botInfo,
          defaultChatId: botServiceStatus.defaultChatId ? 'Đã cấu hình' : 'Chưa cấu hình',
          botPollingRunning: botServiceStatus.isRunning,
          cronRunning: cronStatus.isRunning,
          cronExpression: cronStatus.cronExpression,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái Telegram:',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/telegram/send-report
   * Kích hoạt gửi báo cáo doanh thu ngay lập tức
   */
  public async sendReport(req: Request, res: Response): Promise<void> {
    try {
      const { targetDate, startDate, endDate, chatId } = req.body || {};
      let start: Date;
      let end: Date | undefined;

      if (startDate) {
        start = new Date(startDate);
        end = endDate ? new Date(endDate) : undefined;
      } else if (targetDate) {
        start = new Date(targetDate);
        end = new Date(start);
      } else {
        start = new Date();
      }

      const result = await reportService.sendDailyReport(start, end, chatId);

      res.status(200).json({
        success: result.success,
        message: result.success
          ? 'Báo cáo đã được gửi thành công đến Telegram'
          : `Không thể gửi báo cáo: ${result.error}`,
        data: {
          messageId: result.messageId,
          reportData: result.data,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi báo cáo:',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/telegram/preview-report
   * Xem trước nội dung báo cáo dạng JSON & HTML mà không cần gửi tin nhắn
   */
  public async previewReport(req: Request, res: Response): Promise<void> {
    try {
      const { date, startDate, endDate, days } = req.query;
      let start: Date;
      let end: Date | undefined;

      if (days && !isNaN(Number(days))) {
        const numDays = Math.max(1, Number(days));
        end = new Date();
        start = new Date();
        start.setDate(start.getDate() - (numDays - 1));
      } else if (startDate) {
        start = new Date(String(startDate));
        end = endDate ? new Date(String(endDate)) : undefined;
      } else if (date) {
        start = new Date(String(date));
        end = new Date(start);
      } else {
        start = new Date();
      }

      const data = await reportService.getDailyReportData(start, end);
      const htmlContent = reportService.formatReportHtml(data);

      res.status(200).json({
        success: true,
        message: 'Trích xuất báo cáo thành công',
        data: {
          summary: data,
          formattedHtml: htmlContent,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo bản xem trước báo cáo:',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/telegram/test-alert
   * Bắn thử nghiệm tin nhắn cảnh báo sự cố khẩn cấp
   */
  public async testAlert(req: Request, res: Response): Promise<void> {
    try {
      const { title, reason, eventType, orderId, chatId } = req.body || {};

      const result = await telegramAlertService.sendCriticalAlert(
        {
          title: title || 'Thử nghiệm cảnh báo hệ thống từ Admin API',
          eventType: eventType || 'MANUAL_TEST_ALERT',
          orderId: orderId || 'TEST-ORDER-UUID-001',
          reason: reason || 'Kiểm thử đường truyền thông báo thời gian thực tới Telegram Admin.',
          actionTaken: 'Hệ thống xác nhận kênh liên lạc hoạt động bình thường.',
        },
        chatId
      );

      res.status(200).json({
        success: result.success,
        message: result.success
          ? 'Đã gửi cảnh báo thử nghiệm tới Telegram'
          : `Gửi cảnh báo thất bại: ${result.error}`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi cảnh báo thử nghiệm:',
        error: error.message,
      });
    }
  }
}

export const telegramController = new TelegramController();
