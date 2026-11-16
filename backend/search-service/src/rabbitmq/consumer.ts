import amqp from "amqplib";
import { indexProduct, removeProduct } from "../services/indexer.service";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE = "product.events";
const QUEUE = "search-service.product.events";

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export async function startConsumer(): Promise<void> {
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    connection = conn as any;
    channel = await conn.createChannel();

    // Khai báo exchange — phải giống hệt catalog-service đã khai báo
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });

    // Tạo queue riêng cho search-service
    const q = await channel.assertQueue(QUEUE, { durable: true });

    // Bind queue với các routing keys cần lắng nghe
    await channel.bindQueue(q.queue, EXCHANGE, "product.created");
    await channel.bindQueue(q.queue, EXCHANGE, "product.updated");
    await channel.bindQueue(q.queue, EXCHANGE, "product.deleted");

    console.log("[RabbitMQ Consumer] Đang lắng nghe sự kiện sản phẩm...");

    // Xử lý từng message nhận được
    channel.consume(q.queue, async (msg) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      const content = msg.content.toString();

      try {
        const payload = JSON.parse(content);
        console.log(`[Consumer] Nhận event: ${routingKey}`);

        if (
          routingKey === "product.created" ||
          routingKey === "product.updated"
        ) {
          await indexProduct(payload);
        } else if (routingKey === "product.deleted") {
          await removeProduct(payload.id);
        }

        // Xác nhận đã xử lý xong — RabbitMQ sẽ xóa message khỏi queue
        channel!.ack(msg);
      } catch (error) {
        console.error(`[Consumer] Lỗi xử lý event ${routingKey}:`, error);
        // Nếu xử lý thất bại, đưa message trở lại queue để xử lý lại
        channel!.nack(msg, false, true);
      }
    });
  } catch (error) {
    console.error(
      "[RabbitMQ Consumer] Kết nối thất bại, thử lại sau 5 giây...",
      error,
    );
    setTimeout(startConsumer, 5000);
  }
}
