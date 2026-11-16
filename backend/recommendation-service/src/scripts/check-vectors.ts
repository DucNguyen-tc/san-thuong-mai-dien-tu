import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.productVector.count();
  console.log('Product vectors count:', count);
  const sample = await prisma.productVector.findFirst();
  console.log('Sample product vector:', sample);
}

main().catch(console.error).finally(() => prisma.$disconnect());
