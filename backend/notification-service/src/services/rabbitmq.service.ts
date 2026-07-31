import * as amqplib from 'amqplib';
import { sendEmail } from './email.service';
import { 
  orderConfirmationTemplate, 
  orderShippingTemplate, 
  orderDeliveredTemplate, 
  orderCancelledTemplate 
} from '../templates/email.templates';
import { prisma } from '../config/prisma';

class RabbitMQService {
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  async connect() {
    try {
      this.connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
      this.channel = await this.connection!.createChannel();
      
      console.log('Connected to RabbitMQ');
      
      await this.setupConsumers();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ', error);
      // Retry in 5 seconds
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async processEmailEvent(
    msg: amqplib.ConsumeMessage, 
    templateCode: string, 
    subjectPrefix: string,
    fallbackTemplateFn: (orderId: string, customerName: string, totalAmount: string) => string
  ) {
    let notificationRecord;
    try {
      const content = JSON.parse(msg.content.toString());
      
      // 1. Tạo bản ghi PENDING trong DB
      try {
        notificationRecord = await prisma.notification.create({
          data: {
            recipient_email: content.email,
            template_code: templateCode,
            related_order_id: content.orderId,
            payload: content,
            status: 'PENDING'
          }
        });
      } catch (dbErr) {
        console.error('Lỗi khi ghi log DB:', dbErr);
      }

      // 2. Load template (ưu tiên DB, fallback tĩnh)
      let htmlContent = '';
      try {
        const template = await prisma.notificationTemplate.findUnique({
          where: { code: templateCode }
        });
        if (template) {
          htmlContent = template.body_template
            .replace(/{{orderId}}/g, content.orderId)
            .replace(/{{customerName}}/g, content.customerName)
            .replace(/{{totalAmount}}/g, content.totalAmount);
        }
      } catch (dbErr) {
        console.error('Lỗi lấy template từ DB:', dbErr);
      }

      if (!htmlContent) {
        htmlContent = fallbackTemplateFn(
          content.orderId,
          content.customerName,
          content.totalAmount
        );
      }
      
      // 3. Gửi email
      const emailSent = await sendEmail(content.email, `${subjectPrefix} #${content.orderId}`, htmlContent);
      if (!emailSent) {
        throw new Error('Gửi email thất bại (Nodemailer return false)');
      }
      console.log(`Email sent successfully for order ${content.orderId} (${templateCode})`);

      // 4. Update status SENT
      if (notificationRecord) {
        await prisma.notification.update({
          where: { id: notificationRecord.id },
          data: { status: 'SENT', sent_at: new Date() }
        });
      }

      this.channel?.ack(msg);
    } catch (error) {
      console.error('Error processing message:', error);
      if (notificationRecord) {
        await prisma.notification.update({
          where: { id: notificationRecord.id },
          data: { status: 'FAILED' }
        }).catch((err) => console.error('Failed to update log to FAILED:', err));
      }
      this.channel?.nack(msg, false, false);
    }
  }

  private async setupConsumers() {
    if (!this.channel) return;

    const exchange = 'order_events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    // 1. Lắng nghe sự kiện order.completed (Xác nhận đơn hàng)
    const queueConfirm = await this.channel.assertQueue('notification_order_completed', { durable: true });
    await this.channel.bindQueue(queueConfirm.queue, exchange, 'order.completed');
    this.channel.consume(queueConfirm.queue, async (msg) => {
      if (msg) await this.processEmailEvent(msg, 'ORDER_CONFIRM', 'Xác nhận đơn hàng', orderConfirmationTemplate);
    });

    // 2. Lắng nghe sự kiện order.shipping (Đang giao hàng)
    const queueShipping = await this.channel.assertQueue('notification_order_shipping', { durable: true });
    await this.channel.bindQueue(queueShipping.queue, exchange, 'order.shipping');
    this.channel.consume(queueShipping.queue, async (msg) => {
      if (msg) await this.processEmailEvent(msg, 'ORDER_SHIPPING', 'Đơn hàng đang được giao', orderShippingTemplate);
    });

    // 3. Lắng nghe sự kiện order.delivered (Giao hàng thành công)
    const queueDelivered = await this.channel.assertQueue('notification_order_delivered', { durable: true });
    await this.channel.bindQueue(queueDelivered.queue, exchange, 'order.delivered');
    this.channel.consume(queueDelivered.queue, async (msg) => {
      if (msg) await this.processEmailEvent(msg, 'ORDER_DELIVERED', 'Giao hàng thành công', orderDeliveredTemplate);
    });

    // 4. Lắng nghe sự kiện order.cancelled (Hủy đơn hàng)
    const queueCancelled = await this.channel.assertQueue('notification_order_cancelled', { durable: true });
    await this.channel.bindQueue(queueCancelled.queue, exchange, 'order.cancelled');
    this.channel.consume(queueCancelled.queue, async (msg) => {
      if (msg) await this.processEmailEvent(msg, 'ORDER_CANCELLED', 'Đơn hàng đã bị hủy', orderCancelledTemplate);
    });

    console.log('Listening for order events (completed, shipping, delivered, cancelled)...');
  }
}

export const rabbitMQService = new RabbitMQService();
