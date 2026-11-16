import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { rabbitMQService } from "./rabbitmq/rabbitmq.service";

const PORT = process.env.PORT || 3009;

app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 Support Service is running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/support/health`);
  console.log(`===============================================`);

  // Kết nối RabbitMQ cho luồng xử lý nền
  await rabbitMQService.connect();
});

