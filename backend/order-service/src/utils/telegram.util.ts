import axios, { AxiosInstance } from 'axios';

export interface TelegramBotUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
  };
}

export class TelegramUtil {
  private static instance: TelegramUtil;
  private client: AxiosInstance;
  private botToken: string;
  private defaultChatId: string;
  private whitelistChatIds: Set<string>;

  private constructor() {
    this.botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    this.defaultChatId = (process.env.TELEGRAM_CHAT_ID || '').trim();

    // Whitelist: bao gồm defaultChatId và các id bổ sung phân tách bởi dấu phẩy
    const rawWhitelist = process.env.TELEGRAM_WHITELIST_CHATS || this.defaultChatId;
    const ids = rawWhitelist
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
    this.whitelistChatIds = new Set(ids);

    this.client = axios.create({
      baseURL: `https://api.telegram.org/bot${this.botToken}`,
      timeout: 30000,
    });
  }

  public static getInstance(): TelegramUtil {
    if (!TelegramUtil.instance) {
      TelegramUtil.instance = new TelegramUtil();
    }
    return TelegramUtil.instance;
  }

  /**
   * Cập nhật lại config khi env thay đổi trong runtime hoặc test
   */
  public reloadConfig(): void {
    this.botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    this.defaultChatId = (process.env.TELEGRAM_CHAT_ID || '').trim();
    const rawWhitelist = process.env.TELEGRAM_WHITELIST_CHATS || this.defaultChatId;
    const ids = rawWhitelist
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
    this.whitelistChatIds = new Set(ids);

    this.client = axios.create({
      baseURL: `https://api.telegram.org/bot${this.botToken}`,
      timeout: 30000,
    });
  }

  /**
   * Kiểm tra xem Bot Token và Chat ID đã được cấu hình hay chưa
   */
  public isConfigured(): boolean {
    return (
      Boolean(this.botToken) &&
      this.botToken !== 'your_bot_token_here' &&
      !this.botToken.startsWith('YOUR_')
    );
  }

  public getDefaultChatId(): string {
    return this.defaultChatId;
  }

  /**
   * Kiểm tra xem một Chat ID có nằm trong danh sách Admin được phép tương tác không
   */
  public isAuthorized(chatId: string | number): boolean {
    const idStr = String(chatId).trim();
    if (this.whitelistChatIds.size === 0) {
      // Nếu chưa cấu hình whitelist, mặc định so khớp với defaultChatId
      return Boolean(this.defaultChatId && this.defaultChatId === idStr);
    }
    return this.whitelistChatIds.has(idStr);
  }

  /**
   * Lấy thông tin về Bot từ Telegram API
   */
  public async getMe(): Promise<TelegramBotUser | null> {
    if (!this.isConfigured()) return null;

    try {
      const response = await this.client.get('/getMe');
      if (response.data && response.data.ok) {
        return response.data.result as TelegramBotUser;
      }
      return null;
    } catch (error: any) {
      console.error('[TelegramUtil] getMe error:', error.response?.data?.description || error.message);
      return null;
    }
  }

  /**
   * Đăng ký menu slash command trên ứng dụng Telegram
   */
  public async setMyCommands(commands: { command: string; description: string }[]): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const response = await this.client.post('/setMyCommands', { commands });
      return Boolean(response.data?.ok);
    } catch (error: any) {
      console.error('[TelegramUtil] setMyCommands error:', error.response?.data?.description || error.message);
      return false;
    }
  }

  /**
   * Gửi tin nhắn HTML tới Telegram kèm cơ chế Retry với Exponential Backoff
   * @param htmlContent Nội dung định dạng HTML
   * @param targetChatId Chat ID đích (mặc định lấy từ TELEGRAM_CHAT_ID)
   * @param maxRetries Số lần thử lại tối đa khi gặp lỗi mạng/rate limit (mặc định 3)
   */
  public async sendMessage(
    htmlContent: string,
    targetChatId?: string,
    maxRetries: number = 3
  ): Promise<{ success: boolean; messageId?: number; error?: string }> {
    if (!this.isConfigured()) {
      console.warn('[TelegramUtil] Bot token chưa được cấu hình. Bỏ qua gửi tin nhắn.');
      return { success: false, error: 'TELEGRAM_BOT_TOKEN_NOT_CONFIGURED' };
    }

    const chatId = (targetChatId || this.defaultChatId).trim();
    if (!chatId || chatId === 'your_chat_id_here') {
      console.warn('[TelegramUtil] Chat ID chưa được cấu hình. Bỏ qua gửi tin nhắn.');
      return { success: false, error: 'TELEGRAM_CHAT_ID_NOT_CONFIGURED' };
    }

    let attempt = 0;
    let delayMs = 1500;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const response = await this.client.post('/sendMessage', {
          chat_id: chatId,
          text: htmlContent,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });

        if (response.data && response.data.ok) {
          const messageId = response.data.result?.message_id;
          return { success: true, messageId };
        }

        throw new Error(response.data?.description || 'Unknown Telegram API error');
      } catch (error: any) {
        const isLastAttempt = attempt >= maxRetries;
        const status = error.response?.status;
        const errorDesc = error.response?.data?.description || error.message;

        // Xử lý Rate Limit (HTTP 429)
        if (status === 429) {
          const retryAfter = error.response?.data?.parameters?.retry_after || 5;
          console.warn(`[TelegramUtil] Rate limit 429. Đợi ${retryAfter}s rồi thử lại (Lần ${attempt}/${maxRetries})...`);
          if (!isLastAttempt) {
            await this.sleep(retryAfter * 1000);
            continue;
          }
        }

        // Xử lý lỗi cú pháp HTML (can't parse entities) -> Tự động fallback sang Plaintext
        if (typeof errorDesc === 'string' && errorDesc.includes("can't parse entities")) {
          try {
            console.warn('[TelegramUtil] Lỗi cú pháp HTML parse entities, chuyển sang gửi dạng văn bản thuần (plaintext fallback)...');
            const strippedText = htmlContent.replace(/<[^>]*>/g, '');
            const fallbackRes = await this.client.post('/sendMessage', {
              chat_id: chatId,
              text: strippedText,
              disable_web_page_preview: true,
            });
            if (fallbackRes.data && fallbackRes.data.ok) {
              return { success: true, messageId: fallbackRes.data.result?.message_id };
            }
          } catch (fbErr: any) {
            console.error('[TelegramUtil] Fallback gửi plain text thất bại:', fbErr.message);
          }
        }

        console.error(`[TelegramUtil] Gửi tin nhắn thất bại (Lần ${attempt}/${maxRetries}):`, errorDesc);

        if (isLastAttempt) {
          return { success: false, error: errorDesc };
        }

        // Exponential backoff
        await this.sleep(delayMs);
        delayMs *= 2;
      }
    }

    return { success: false, error: 'MAX_RETRIES_EXCEEDED' };
  }

  /**
   * Lấy các tin nhắn mới từ Telegram (Long Polling)
   * @param offset Offset ID của tin nhắn tiếp theo
   * @param timeout Thời gian chờ long-polling tính theo giây (10-30s)
   */
  public async getUpdates(offset: number, timeout: number = 20): Promise<TelegramUpdate[]> {
    if (!this.isConfigured()) return [];

    try {
      const response = await this.client.get('/getUpdates', {
        params: {
          offset,
          timeout,
          allowed_updates: JSON.stringify(['message']),
        },
        timeout: (timeout + 5) * 1000,
      });

      if (response.data && response.data.ok && Array.isArray(response.data.result)) {
        return response.data.result as TelegramUpdate[];
      }
      return [];
    } catch (error: any) {
      // Khi timeout thông thường hoặc rớt mạng tạm thời, không in spam log quá mức
      if (error.code !== 'ECONNABORTED' && error.response?.status !== 504) {
        console.error('[TelegramUtil] getUpdates error:', error.response?.data?.description || error.message);
      }
      return [];
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const telegramUtil = TelegramUtil.getInstance();
