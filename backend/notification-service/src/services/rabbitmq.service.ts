import * as amqplib from 'amqplib';
import { sendEmail } from './email.service';
import { orderConfirmationTemplate } from '../templates/email.templates';

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

  private async setupConsumers() {
    if (!this.channel) return;

    // Lắng nghe sự kiện order.completed
    const exchange = 'order_events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    
    const queue = await this.channel.assertQueue('notification_order_completed', { durable: true });
    await this.channel.bindQueue(queue.queue, exchange, 'order.completed');

    console.log('Listening for order.completed events...');

    this.channel.consume(queue.queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          
          // Gửi email xác nhận đơn hàng
          const htmlContent = orderConfirmationTemplate(
            content.orderId,
            content.customerName,
            content.totalAmount
          );
          await sendEmail(content.email, `Xác nhận đơn hàng #${content.orderId}`, htmlContent);

          console.log(`Email sent for order ${content.orderId}`);
          this.channel?.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          // Nack and do not requeue for now (to avoid infinite loop if email fails)
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }
}

export const rabbitMQService = new RabbitMQService();
