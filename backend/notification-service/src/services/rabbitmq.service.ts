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

    // 5. Lắng nghe sự kiện support.ticket.replied (Phản hồi hỗ trợ từ CSKH)
    const supportExchange = "support_events";
    await this.channel.assertExchange(supportExchange, "topic", { durable: true });
    const queueSupportReply = await this.channel.assertQueue("notification_support_ticket_reply", { durable: true });
    await this.channel.bindQueue(queueSupportReply.queue, supportExchange, "support.ticket.replied");

    this.channel.consume(queueSupportReply.queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        console.log(`[Notification Service] Nhận sự kiện email phản hồi ticket ${data.ticketNumber} tới ${data.recipientEmail}`);

        // Đảm bảo template tồn tại trong DB để tránh lỗi FK
        try {
          await prisma.notificationTemplate.upsert({
            where: { code: "SUPPORT_TICKET_REPLY" },
            update: {},
            create: {
              code: "SUPPORT_TICKET_REPLY",
              subject_template: "[{{ticketNumber}}] Phản hồi hỗ trợ: {{ticketSubject}}",
              body_template: "{{finalResponse}}"
            }
          });
        } catch (tplErr) {
          // Ignore if upsert failed
        }

        // Ghi log DB PENDING
        let notifRecord;
        try {
          notifRecord = await prisma.notification.create({
            data: {
              recipient_email: data.recipientEmail,
              template_code: "SUPPORT_TICKET_REPLY",
              payload: data,
              status: "PENDING"
            }
          });
        } catch (dbErr) {
          console.warn("Log DB notification warning:", dbErr);
        }

        // HTML Template
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2563eb; margin-bottom: 8px;">Sàn Thương Mại Điện Tử - Phản hồi Hỗ trợ</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 0;">Mã ticket: <strong>${data.ticketNumber}</strong> | Vấn đề: <strong>${data.ticketSubject}</strong></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <div style="font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${data.finalResponse}</div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">Nếu cần hỗ trợ thêm, Quý khách vui lòng trả lời trực tiếp email này hoặc liên hệ hotline CSKH 1900-xxxx.</p>
          </div>
        `;

        const sent = await sendEmail(data.recipientEmail, data.emailSubject, htmlBody);
        if (notifRecord) {
          await prisma.notification.update({
            where: { id: notifRecord.id },
            data: { status: sent ? "SENT" : "FAILED", sent_at: sent ? new Date() : null }
          });
        }
        this.channel?.ack(msg);
      } catch (err) {
        console.error("[Notification Service] Lỗi xử lý gửi email ticket:", err);
        this.channel?.nack(msg, false, false);
      }
    });

    console.log('Listening for order events (completed, shipping, delivered, cancelled) and support events...');
  }
}

export const rabbitMQService = new RabbitMQService();
