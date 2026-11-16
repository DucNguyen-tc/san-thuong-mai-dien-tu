import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.$queryRawUnsafe('SELECT COUNT(*) as cnt FROM product_vectors')
  .then((r: any) => {
    console.log('Vectors in DB:', Number(r[0].cnt));
    return p.$disconnect();
  })
  .then(() => process.exit(0))
  .catch((e: any) => { console.error(e); process.exit(1); });
