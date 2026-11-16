import amqp from 'amqplib';
import { RecommendationService } from '../services/recommendation.service';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'product.events';
const QUEUE_NAME = 'recommendation.product.sync';

export async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Khai báo Exchange (sử dụng topic để có thể bắt nhiều routing keys)
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    // Khai báo Queue
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    // Bind queue với các sự kiện tạo/cập nhật sản phẩm
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'product.created');
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'product.updated');

    const recommendationService = new RecommendationService();

    console.log(`[RabbitMQ] Listening for product events on queue: ${QUEUE_NAME}`);

    // Bắt đầu lắng nghe tin nhắn
    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const routingKey = msg.fields.routingKey;
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`[RabbitMQ] Received event: ${routingKey}`, content.id);

          // Trích xuất thông tin sản phẩm từ payload
          const { id, name, description, category } = content;
          const categoryName = category?.name || '';

          // Tính lại vector TF-IDF và lưu đè vào DB
          await recommendationService.updateProductVector(id, name, description, categoryName);

          // Xử lý thành công -> Xóa message khỏi queue
          channel.ack(msg);
        } catch (error) {
          console.error(`[RabbitMQ] Error processing event ${routingKey}`, error);
          // Re-queue hoặc ném vào Dead-letter exchange tùy cấu hình
          channel.nack(msg, false, false);
        }
      }
    });

  } catch (error) {
    console.error('[RabbitMQ] Connection failed', error);
    // Có thể set timeout retry ở đây
    setTimeout(connectRabbitMQ, 5000);
  }
}
