import app from './app';
import { prisma } from './config/prisma';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
