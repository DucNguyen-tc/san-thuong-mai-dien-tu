import fs from 'fs';
import path from 'path';
import cron, { ScheduledTask } from 'node-cron';
import { reportService } from '../services/report.service';

const CONFIG_FILE = path.resolve(__dirname, '../../cron-config.json');

function loadPersistedCron(): string | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (data && typeof data.cronExpression === 'string' && cron.validate(data.cronExpression)) {
        return data.cronExpression.trim();
      }
    }
  } catch (err) {
    console.error('[DailyReportCron] Không thể đọc cron-config.json:', err);
  }
  return null;
}

function savePersistedCron(cronExpression: string): void {
  try {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify({ cronExpression, updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('[DailyReportCron] Không thể ghi cron-config.json:', err);
  }
}

export class DailyReportCron {
  private static instance: DailyReportCron;
  private task: ScheduledTask | null = null;
  private cronExpression: string;

  private constructor() {
    this.cronExpression = loadPersistedCron() || process.env.TELEGRAM_REPORT_CRON || '0 23 * * *';
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

    console.log(`[DailyReportCron] 📅 Đã lập lịch gửi báo cáo tự động qua Telegram với biểu thức: "${this.cronExpression}"`);
  }

  /**
   * Cập nhật và lập lại lịch trình mới tại thời gian thực
   */
  public reschedule(newCronExpression: string): { success: boolean; message: string; cronExpression: string } {
    const trimmed = (newCronExpression || '').trim();
    if (!cron.validate(trimmed)) {
      throw new Error(`Cú pháp cron không hợp lệ: "${newCronExpression}". Ví dụ cú pháp đúng: "0 23 * * *" hoặc "30 8 * * *"`);
    }

    if (this.task) {
      this.task.stop();
      this.task = null;
    }

    this.cronExpression = trimmed;
    process.env.TELEGRAM_REPORT_CRON = trimmed;
    savePersistedCron(trimmed);
    this.start();

    return {
      success: true,
      message: `Đã cập nhật lịch phát báo cáo tự động thành công: "${this.cronExpression}"`,
      cronExpression: this.cronExpression,
    };
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
