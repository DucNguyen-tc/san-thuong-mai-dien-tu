import app from "./app";
import { prisma } from "./config/prisma";

// Patch BigInt serialization globally
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const PORT = process.env.PORT || 3001;

import { connectRabbitMQ } from "./rabbitmq/publisher";

async function bootstrap() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log("Database connected successfully");

    // Connect to RabbitMQ
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
