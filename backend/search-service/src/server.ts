import app from "./app";
import { env } from "./config/env";
import { esClient } from "./config/elasticsearch";
import { initElasticsearch } from "./elasticsearch/setup";
import { startConsumer } from "./rabbitmq/consumer"; // THÊM DÒNG NÀY

async function bootstrap() {
  try {
    console.log("Đang kiểm tra kết nối tới Elasticsearch...");
    const pingResult = await esClient.ping();

    if (!pingResult) {
      throw new Error("Elasticsearch ping failed");
    }
    console.log("Kết nối Elasticsearch thành công!");

    await initElasticsearch();

    await startConsumer(); // THÊM DÒNG NÀY — bắt đầu lắng nghe RabbitMQ

    app.listen(env.PORT, () => {
      console.log(`Search Service đang chạy tại port ${env.PORT}`);
      console.log(`Health check: http://localhost:${env.PORT}/health`);
      console.log(`ES Health check: http://localhost:${env.PORT}/health/es`);
    });
  } catch (error) {
    console.error("Khởi động Search Service thất bại:", error);
    process.exit(1);
  }
}

bootstrap();
