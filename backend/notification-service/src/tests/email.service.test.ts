import { sendEmail } from '../services/email.service';
import nodemailer from 'nodemailer';

jest.mock('nodemailer', () => {
  const mSendMail = jest.fn();
  return {
    createTransport: jest.fn(() => ({
      sendMail: mSendMail
    }))
  };
});

describe('Email Service', () => {
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    const transporter = nodemailer.createTransport({});
    mockSendMail = transporter.sendMail as jest.Mock;
    jest.clearAllMocks();
  });

  it('03. Gửi Email thành công', async () => {
    // 1. Mock Nodemailer sendMail() trả về success
    mockSendMail.mockResolvedValue({ messageId: 'test_id_123' });

    // 2. Gọi hàm gửi email
    const result = await sendEmail('test@gmail.com', 'Subject', '<p>Test</p>');

    // 3. Kết quả mong đợi: Trả về true
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@gmail.com',
      html: '<p>Test</p>'
    }));
  });

  it('04. Gửi Email thất bại do SMTP lỗi', async () => {
    // 1. Mock Nodemailer giả lập sự cố đứt kết nối mạng
    mockSendMail.mockRejectedValue(new Error('SMTP Connection Error'));

    // 2. Gọi hàm gửi email
    const result = await sendEmail('test@gmail.com', 'Subject', '<p>Test</p>');

    // 3. Kết quả mong đợi: Bắt lỗi và trả về false
    expect(result).toBe(false);
  });
});
