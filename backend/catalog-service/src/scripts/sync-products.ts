import { PrismaClient } from '@prisma/client';
import { connectRabbitMQ, publishProductEvent } from '../rabbitmq/publisher';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to RabbitMQ...');
  await connectRabbitMQ();

  console.log('Fetching products from catalog database...');
  const products = await prisma.product.findMany({
    include: {
      category: true,
    }
  });

  console.log(`Found ${products.length} products. Publishing events...`);

  for (const p of products) {
    publishProductEvent('product.created', {
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category ? { id: p.category.id, name: p.category.name } : null
    });
  }

  console.log('All events published. Waiting 5 seconds to ensure delivery...');
  await new Promise(resolve => setTimeout(resolve, 5000));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
