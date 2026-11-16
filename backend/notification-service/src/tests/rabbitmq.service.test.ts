import { rabbitMQService } from '../services/rabbitmq.service';
import { sendEmail } from '../services/email.service';
import { prisma } from '../config/prisma';

// Giả lập email.service
jest.mock('../services/email.service', () => ({
  sendEmail: jest.fn()
}));

// Giả lập prisma
jest.mock('../config/prisma', () => ({
  prisma: {
    notification: {
      create: jest.fn(),
      update: jest.fn(),
    },
    notificationTemplate: {
      findUnique: jest.fn(),
    }
  }
}));

describe('RabbitMQ Service', () => {
  let channelMock: any;

  beforeEach(() => {
    channelMock = {
      ack: jest.fn(),
      nack: jest.fn(),
    };
    // Gán mock channel vào service (hack access private property for testing)
    (rabbitMQService as any).channel = channelMock;
    jest.clearAllMocks();
  });

  it('01. Nhận tín hiệu Đặt hàng thành công', async () => {
    const mockPayload = { email: 'test@gmail.com', orderId: 'ORD123' };
    const msg = { content: Buffer.from(JSON.stringify(mockPayload)) } as any;

    // Giả lập DB và gửi mail thành công
    (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 1 });
    (prisma.notificationTemplate.findUnique as jest.Mock).mockResolvedValue(null);
    (sendEmail as jest.Mock).mockResolvedValue(true);

    // Gọi hàm consumer
    await (rabbitMQService as any).processEmailEvent(msg, 'ORDER_CONFIRM', 'Prefix', () => 'Fallback HTML');

    // Kết quả mong đợi: Bóc tách thành công và gọi sendEmail
    expect(sendEmail).toHaveBeenCalledWith('test@gmail.com', 'Prefix #ORD123', 'Fallback HTML');
    expect(channelMock.ack).toHaveBeenCalledWith(msg);
  });

  it('02. Nhận tín hiệu rác (Sai định dạng)', async () => {
    const msg = { content: Buffer.from('invalid-json') } as any;

    await (rabbitMQService as any).processEmailEvent(msg, 'ORDER_CONFIRM', 'Prefix', () => '');

    // Kết quả mong đợi: Message bị reject (nack)
    expect(channelMock.nack).toHaveBeenCalledWith(msg, false, false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('05. Render Template HTML Email', async () => {
    const mockPayload = { email: 'test@gmail.com', orderId: 'O-111', customerName: 'Alice', totalAmount: '100K' };
    const msg = { content: Buffer.from(JSON.stringify(mockPayload)) } as any;

    // Mock DB trả về template hợp lệ
    (prisma.notificationTemplate.findUnique as jest.Mock).mockResolvedValue({
      body_template: 'Xin chào {{customerName}}, đơn {{orderId}} tổng {{totalAmount}}'
    });
    (sendEmail as jest.Mock).mockResolvedValue(true);

    await (rabbitMQService as any).processEmailEvent(msg, 'TEST', 'Prefix', () => '');

    // Kết quả mong đợi: Chuỗi HTML được thay thế biến thành công
    const expectedHtml = 'Xin chào Alice, đơn O-111 tổng 100K';
    expect(sendEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expectedHtml
    );
  });

  it('06. Lưu Log lịch sử thông báo', async () => {
    const mockPayload = { email: 'test@gmail.com', orderId: 'ORD123' };
    const msg = { content: Buffer.from(JSON.stringify(mockPayload)) } as any;

    // Giả lập lưu DB thành công
    const mockRecord = { id: 99 };
    (prisma.notification.create as jest.Mock).mockResolvedValue(mockRecord);
    (sendEmail as jest.Mock).mockResolvedValue(true);

    await (rabbitMQService as any).processEmailEvent(msg, 'ORDER_CONFIRM', 'Prefix', () => '');

    // 1. Kiểm tra log ban đầu PENDING
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'PENDING' })
    });

    // 2. Sau khi gửi thành công -> Update log SENT
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 99 },
      data: expect.objectContaining({ status: 'SENT' })
    });
  });
});
