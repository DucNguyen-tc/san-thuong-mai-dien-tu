import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';

const prisma = new PrismaClient();
const catalogDb = new Client({
  connectionString: process.env.CATALOG_DATABASE_URL || 'postgresql://admin:1234567@localhost:5432/catalog_db?schema=public'
});

/**
 * Seed dữ liệu hành vi giả lập cho Collaborative Filtering.
 * 
 * Chiến lược:
 * - Đọc toàn bộ danh sách sản phẩm và phân loại category từ Catalog DB.
 * - Tạo tương tác CLICK giả lập trong cùng category và giữa các category liên quan.
 * - Tạo IMPRESSION và PURCHASE cho các sản phẩm tiêu biểu để phục vụ ranking và popular recommendations.
 */
async function main() {
  console.log('Connecting to databases...');
  await catalogDb.connect();

  console.log('Fetching products from Catalog DB...');
  const res = await catalogDb.query(`
    SELECT p.id, p.name, c.id as category_id, c.name as category_name
    FROM "products" p
    LEFT JOIN "categories" c ON p.category_id = c.id
    ORDER BY c.name, p.created_at DESC
  `);

  const products = res.rows;
  console.log(`Fetched ${products.length} products from Catalog DB.`);

  if (products.length === 0) {
    console.error('ERROR: Chưa có sản phẩm nào trong Catalog DB.');
    process.exit(1);
  }

  // Phân nhóm theo danh mục
  const categoryGroups = new Map<string, Array<{ id: string; name: string }>>();
  for (const p of products) {
    const catName = p.category_name || 'Khác';
    if (!categoryGroups.has(catName)) {
      categoryGroups.set(catName, []);
    }
    categoryGroups.get(catName)!.push({ id: p.id, name: p.name });
  }

  console.log(`Grouped into ${categoryGroups.size} categories.`);

  const logs: Array<{
    source_product_id: string;
    recommended_product_id: string;
    event_type: 'CLICK' | 'IMPRESSION' | 'PURCHASE';
    similarity_score: number;
  }> = [];

  // Tương tác nội bộ danh mục (càng gần nhau độ liên quan càng cao)
  function addGroupInteractions(group: Array<{ id: string; name: string }>, baseClicks: number = 3) {
    for (let i = 0; i < group.length; i++) {
      for (let j = 0; j < group.length; j++) {
        if (i === j) continue;
        const dist = Math.abs(i - j);
        if (dist > 6) continue;

        const clicks = Math.max(1, baseClicks - Math.floor(dist / 2));
        for (let k = 0; k < clicks; k++) {
          logs.push({
            source_product_id: group[i].id,
            recommended_product_id: group[j].id,
            event_type: 'CLICK',
            similarity_score: Math.max(0.4, 0.9 - dist * 0.08)
          });
        }
      }
    }
  }

  // Tương tác chéo giữa 2 danh mục liên quan
  function addCrossGroupInteractions(
    groupA?: Array<{ id: string; name: string }>,
    groupB?: Array<{ id: string; name: string }>,
    sampleCount: number = 4
  ) {
    if (!groupA || !groupB) return;
    const aList = groupA.slice(0, Math.min(sampleCount, groupA.length));
    const bList = groupB.slice(0, Math.min(sampleCount, groupB.length));
    for (const a of aList) {
      for (const b of bList) {
        logs.push({
          source_product_id: a.id,
          recommended_product_id: b.id,
          event_type: 'CLICK',
          similarity_score: 0.6
        });
      }
    }
  }

  // Sinh log tương tác cho từng danh mục
  for (const [catName, prods] of categoryGroups.entries()) {
    if (prods.length >= 2) {
      const isHotCat = [
        'Nước hoa cao cấp',
        'Điện thoại',
        'Laptop',
        'Tai nghe & Âm thanh',
        'Chăm sóc da',
        'Thời trang nữ',
        'Giày thể thao'
      ].includes(catName);

      addGroupInteractions(prods, isHotCat ? 4 : 2);

      // Thêm PURCHASE và IMPRESSION cho top sản phẩm nổi bật
      const topCount = Math.min(5, prods.length);
      for (let i = 0; i < topCount; i++) {
        const nextIdx = (i + 1) % prods.length;
        logs.push({
          source_product_id: prods[i].id,
          recommended_product_id: prods[nextIdx].id,
          event_type: 'PURCHASE',
          similarity_score: 0.95
        });
        logs.push({
          source_product_id: prods[i].id,
          recommended_product_id: prods[nextIdx].id,
          event_type: 'IMPRESSION',
          similarity_score: 0.9
        });
      }
    }
  }

  // Thiết lập liên kết danh mục chéo tự nhiên
  addCrossGroupInteractions(categoryGroups.get('Điện thoại'), categoryGroups.get('Phụ kiện điện thoại'));
  addCrossGroupInteractions(categoryGroups.get('Điện thoại'), categoryGroups.get('Tai nghe & Âm thanh'));
  addCrossGroupInteractions(categoryGroups.get('Laptop'), categoryGroups.get('Phụ kiện công nghệ'));
  addCrossGroupInteractions(categoryGroups.get('Nước hoa cao cấp'), categoryGroups.get('Chăm sóc da'));
  addCrossGroupInteractions(categoryGroups.get('Thời trang nữ'), categoryGroups.get('Túi xách & Balo'));
  addCrossGroupInteractions(categoryGroups.get('Máy ảnh chuyên nghiệp'), categoryGroups.get('Ống kính máy ảnh'));

  console.log(`Generated ${logs.length} behavior logs.`);

  console.log('Clearing old recommendation_logs...');
  await prisma.recommendationLog.deleteMany();

  console.log('Inserting new recommendation_logs in batches...');
  const BATCH_SIZE = 500;
  for (let i = 0; i < logs.length; i += BATCH_SIZE) {
    const batch = logs.slice(i, i + BATCH_SIZE);
    await prisma.recommendationLog.createMany({ data: batch });
    console.log(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(logs.length / BATCH_SIZE)}`);
  }

  const total = await prisma.recommendationLog.count();
  console.log(`\nRecommendation seed completed! Total behavior logs: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await catalogDb.end();
    await prisma.$disconnect();
    process.exit(0);
  });
