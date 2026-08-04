import { PrismaClient } from '@prisma/client';
import { generateFeatureVector } from '../src/utils/tfidf';

const recommendationDb = new PrismaClient();

// Connect to catalog_db manually
const { Client } = require('pg');
const catalogDb = new Client({
  connectionString: 'postgresql://admin:1234567@localhost:5432/catalog_db?schema=public'
});

async function main() {
  console.log('Connecting to Catalog DB...');
  await catalogDb.connect();

  console.log('Fetching products from Catalog DB...');
  const res = await catalogDb.query(`
    SELECT p.id, p.name, p.description, c.name as category_name
    FROM "products" p
    LEFT JOIN "categories" c ON p.category_id = c.id
  `);
  
  const products = res.rows;
  console.log(`Found ${products.length} products in Catalog DB.`);

  console.log('Generating vectors and inserting into Recommendation DB...');
  let count = 0;
  for (const p of products) {
    try {
      const vector = generateFeatureVector(p.name, p.description || '', p.category_name || '');
      const vectorString = `[${vector.join(',')}]`;

      await recommendationDb.$executeRawUnsafe(`
        INSERT INTO product_vectors (product_id, embedding, computed_at)
        VALUES ($1::uuid, $2::vector, NOW())
        ON CONFLICT (product_id) 
        DO UPDATE SET 
          embedding = EXCLUDED.embedding,
          computed_at = NOW();
      `, p.id, vectorString);
      count++;
    } catch (e) {
      console.error(`Failed for product ${p.id}:`, e);
    }
  }

  console.log(`Successfully generated and inserted ${count} vectors.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await catalogDb.end();
    await recommendationDb.$disconnect();
    process.exit(0);
  });
