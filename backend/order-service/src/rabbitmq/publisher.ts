import * as amqplib from 'amqplib';

class RabbitMQPublisher {
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private readonly exchange = 'order_events';

  async connect() {
    try {
      this.connection = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
      this.channel = await this.connection.createChannel();
      
      // Khai báo exchange dạng topic
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      
      console.log('Connected to RabbitMQ as Publisher');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ as Publisher:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publishOrderCompletedEvent(payload: {
    orderId: string;
    customerName: string;
    email: string;
    totalAmount: string;
  }) {
    this.publishEvent('order.completed', payload);
  }

  async publishOrderShippingEvent(payload: {
    orderId: string;
    customerName: string;
    email: string;
    totalAmount: string;
  }) {
    this.publishEvent('order.shipping', payload);
  }

  async publishOrderDeliveredEvent(payload: {
    orderId: string;
    customerName: string;
    email: string;
    totalAmount: string;
  }) {
    this.publishEvent('order.delivered', payload);
  }

  async publishOrderCancelledEvent(payload: {
    orderId: string;
    customerName: string;
    email: string;
    totalAmount: string;
  }) {
    this.publishEvent('order.cancelled', payload);
  }

  private publishEvent(routingKey: string, payload: any) {
    if (!this.channel) {
      console.error('RabbitMQ channel is not established. Cannot publish event.');
      return;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(payload));
      this.channel.publish(this.exchange, routingKey, messageBuffer, {
        persistent: true,
      });
      console.log(`Published ${routingKey} event for order ${payload.orderId}`);
    } catch (error) {
      console.error(`Error publishing ${routingKey} event:`, error);
    }
  }
}

export const rabbitMQPublisher = new RabbitMQPublisher();
