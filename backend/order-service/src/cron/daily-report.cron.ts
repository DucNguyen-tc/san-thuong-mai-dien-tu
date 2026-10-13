import cron, { ScheduledTask } from 'node-cron';
import { reportService } from '../services/report.service';

export class DailyReportCron {
  private static instance: DailyReportCron;
  private task: ScheduledTask | null = null;
  private cronExpression: string;

  private constructor() {
    this.cronExpression = process.env.TELEGRAM_REPORT_CRON || '0 23 * * *';
  }

  public static getInstance(): DailyReportCron {
    if (!DailyReportCron.instance) {
      DailyReportCron.instance = new DailyReportCron();
    }
    return DailyReportCron.instance;
  }

  /**
   * Khởi động lịch trình Cron Job tự động
   */
  public start(): void {
    if (this.task) {
      console.log('[DailyReportCron] Cron job đã đang chạy.');
      return;
    }

    if (!cron.validate(this.cronExpression)) {
      console.error(`[DailyReportCron] Cú pháp cron không hợp lệ: "${this.cronExpression}". Sử dụng mặc định "0 23 * * *"`);
      this.cronExpression = '0 23 * * *';
    }

    this.task = cron.schedule(this.cronExpression, async () => {
      console.log(`[DailyReportCron] ⏰ Kích hoạt tác vụ gửi báo cáo định kỳ (${new Date().toISOString()})...`);
      try {
        await reportService.sendDailyReport();
      } catch (error: any) {
        console.error('[DailyReportCron] Lỗi khi thực thi báo cáo tự động:', error.message);
      }
    });

    console.log(`[DailyReportCron] 📅 Đã lập lịch gửi báo cáo tự động qua Telegram với biểu thức: "${this.cronExpression}" (Mặc định 23:00 đêm hàng ngày)`);
  }

  /**
   * Dừng lịch trình
   */
  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('[DailyReportCron] Đã dừng cron job báo cáo.');
    }
  }

  /**
   * Kích hoạt thủ công ngay lập tức (dành cho API test hoặc nút bấm trên Dashboard)
   */
  public async triggerNow(): Promise<any> {
    console.log('[DailyReportCron] 🚀 Kích hoạt gửi báo cáo thủ công ngay lập tức...');
    return reportService.sendDailyReport();
  }

  public getStatus(): { isRunning: boolean; cronExpression: string } {
    return {
      isRunning: Boolean(this.task),
      cronExpression: this.cronExpression,
    };
  }
}

export const dailyReportCron = DailyReportCron.getInstance();
