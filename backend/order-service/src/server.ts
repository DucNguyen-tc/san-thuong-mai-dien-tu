import app from './app';
import { prisma } from './config/prisma';
import { rabbitMQPublisher } from './rabbitmq/publisher';

const PORT = process.env.PORT || 3004;

async function bootstrap() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connected successfully');

    // Connect to RabbitMQ
    await rabbitMQPublisher.connect();

    app.listen(PORT, () => {
      console.log(`Order Service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
