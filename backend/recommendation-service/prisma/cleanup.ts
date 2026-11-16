/**
 * cleanup.ts
 * Xóa toàn bộ product_vectors và recommendation_logs cũ.
 * Chạy script này TRƯỚC KHI reseed catalog để đảm bảo chỉ còn dữ liệu mới.
 *
 * Lệnh chạy: ts-node prisma/cleanup.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up old recommendation data...');

  const logsDeleted = await prisma.recommendationLog.deleteMany();
  console.log(`  Deleted ${logsDeleted.count} recommendation logs`);

  const vectorsDeleted = await prisma.$executeRawUnsafe('DELETE FROM product_vectors;');
  console.log(`  Deleted ${vectorsDeleted} product vectors`);

  console.log('\nCleanup complete! Now:');
  console.log('  1. Run catalog seed: cd backend/catalog-service && npx prisma db seed');
  console.log('  2. Wait 1-2 minutes for recommendation service to compute vectors via RabbitMQ');
  console.log('  3. Run recommendation seed: cd backend/recommendation-service && npx prisma db seed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
