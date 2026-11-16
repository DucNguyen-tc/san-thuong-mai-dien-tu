import { TelegramUtil } from '../../src/utils/telegram.util';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TelegramUtil - Industrial Grade Telegram Client', () => {
  let instance: TelegramUtil;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuration & Authorization', () => {
    it('should detect when token is not configured or placeholder', () => {
      process.env.TELEGRAM_BOT_TOKEN = 'your_bot_token_here';
      process.env.TELEGRAM_CHAT_ID = 'your_chat_id_here';

      instance = TelegramUtil.getInstance();
      instance.reloadConfig();

      expect(instance.isConfigured()).toBe(false);
    });

    it('should detect valid token and authorize whitelisted chats', () => {
      process.env.TELEGRAM_BOT_TOKEN = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';
      process.env.TELEGRAM_CHAT_ID = '111222333';
      process.env.TELEGRAM_WHITELIST_CHATS = '111222333,444555666';

      instance = TelegramUtil.getInstance();
      instance.reloadConfig();

      expect(instance.isConfigured()).toBe(true);
      expect(instance.isAuthorized('111222333')).toBe(true);
      expect(instance.isAuthorized('444555666')).toBe(true);
      expect(instance.isAuthorized('999999999')).toBe(false);
    });
  });

  describe('sendMessage with Retry & Backoff', () => {
    it('should return error immediately if bot token is not configured', async () => {
      process.env.TELEGRAM_BOT_TOKEN = '';
      instance = TelegramUtil.getInstance();
      instance.reloadConfig();

      const result = await instance.sendMessage('Hello');
      expect(result.success).toBe(false);
      expect(result.error).toBe('TELEGRAM_BOT_TOKEN_NOT_CONFIGURED');
    });

    it('should retry on failure and succeed if subsequent attempt passes', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'valid-token';
      process.env.TELEGRAM_CHAT_ID = '12345';
      instance = TelegramUtil.getInstance();
      instance.reloadConfig();

      const mockPost = jest.fn();
      // First attempt fails, second attempt succeeds
      mockPost
        .mockRejectedValueOnce(new Error('Network glitch'))
        .mockResolvedValueOnce({
          data: { ok: true, result: { message_id: 888 } },
        });

      (instance as any).client = { post: mockPost };
      (instance as any).sleep = jest.fn().mockResolvedValue(undefined); // fast sleep

      const result = await instance.sendMessage('<b>Test message</b>');

      expect(result.success).toBe(true);
      expect(result.messageId).toBe(888);
      expect(mockPost).toHaveBeenCalledTimes(2);
    });
  });
});
