import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategoryPromotions() {
  console.log('Connecting to Prisma...');

  // Find target categories
  const targetSlugs = ['dien-tu', 'thoi-trang', 'suc-khoe-lam-dep', 'nha-cua-doi-song'];
  const categories = await prisma.category.findMany({
    where: { slug: { in: targetSlugs } }
  });
  console.log('Target categories found:', categories.map(c => `${c.name} (${c.slug})`));

  // Also get all categories to find descendants
  const allCategories = await prisma.category.findMany({
    select: { id: true, parent_id: true }
  });

  const getDescendants = (parentId: string): string[] => {
    const children = allCategories.filter(c => c.parent_id === parentId).map(c => c.id);
    return [parentId, ...children.flatMap(getDescendants)];
  };

  const now = new Date();
  const promotionsData = [
    {
      code: 'TECH-FLASH-SALE',
      name: 'Flash Sale Đột Phá Công Nghệ',
      discount_type: 'PERCENT' as const,
      discount_value: 30,
      days: 3,
      slug: 'dien-tu'
    },
    {
      code: 'FASHION-FLASH-SALE',
      name: 'Siêu Hội Thời Trang Xu Hướng',
      discount_type: 'PERCENT' as const,
      discount_value: 40,
      days: 2,
      slug: 'thoi-trang'
    },
    {
      code: 'BEAUTY-FLASH-SALE',
      name: 'Đại Tiệc Nước Hoa & Mỹ Phẩm',
      discount_type: 'PERCENT' as const,
      discount_value: 50,
      days: 4,
      slug: 'suc-khoe-lam-dep'
    },
    {
      code: 'HOME-FLASH-SALE',
      name: 'Bão Deal Nhà Cửa & Đời Sống',
      discount_type: 'PERCENT' as const,
      discount_value: 25,
      days: 5,
      slug: 'nha-cua-doi-song'
    }
  ];

  for (const promoData of promotionsData) {
    const validFrom = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const validTo = new Date(now.getTime() + promoData.days * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 45 * 60 * 1000);

    const promotion = await prisma.promotion.upsert({
      where: { code: promoData.code },
      create: {
        code: promoData.code,
        name: promoData.name,
        discount_type: promoData.discount_type,
        discount_value: promoData.discount_value,
        valid_from: validFrom,
        valid_to: validTo,
        is_active: true,
        min_order_value: 0
      },
      update: {
        name: promoData.name,
        discount_type: promoData.discount_type,
        discount_value: promoData.discount_value,
        valid_from: validFrom,
        valid_to: validTo,
        is_active: true
      }
    });

    console.log(`Promotion saved: ${promotion.name} (${promotion.id})`);

    const rootCat = categories.find(c => c.slug === promoData.slug);
    if (!rootCat) continue;

    const allCatIds = getDescendants(rootCat.id);

    // Get products for these categories
    const products = await prisma.product.findMany({
      where: { category_id: { in: allCatIds }, is_active: true },
      select: { id: true }
    });

    console.log(`Found ${products.length} products for ${promotion.name}`);

    // Remove old promotion_items
    await prisma.promotionItem.deleteMany({
      where: { promotion_id: promotion.id }
    });

    // Insert new promotion items in chunks
    const itemsData = products.map(p => ({
      promotion_id: promotion.id,
      product_id: p.id
    }));

    const CHUNK_SIZE = 100;
    for (let i = 0; i < itemsData.length; i += CHUNK_SIZE) {
      await prisma.promotionItem.createMany({
        data: itemsData.slice(i, i + CHUNK_SIZE),
        skipDuplicates: true
      });
    }

    console.log(`Mapped ${products.length} products to ${promotion.name}`);
  }

  console.log('Seeding category promotions complete!');
}

seedCategoryPromotions()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
