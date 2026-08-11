import { PrismaClient, DiscountType } from "@prisma/client";
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing database...");
  await prisma.stockReservation.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.promotion.deleteMany();

  console.log("Loading dummy data...");
  const dummyFilePath = path.join(__dirname, '../../../dummyjson.json');
  const dummyData = JSON.parse(fs.readFileSync(dummyFilePath, 'utf8'));

  console.log("Seeding Categories with Hierarchy...");
  
  const categoryGroups: Record<string, string[]> = {
    'Điện tử': ['smartphones', 'laptops', 'mobile-accessories', 'tablets'],
    'Thời trang': ['mens-shirts', 'mens-shoes', 'mens-watches', 'womens-bags', 'womens-dresses', 'womens-jewellery', 'womens-shoes', 'womens-watches', 'sunglasses', 'tops'],
    'Sức khỏe & Làm đẹp': ['beauty', 'fragrances', 'skin-care'],
    'Nhà cửa & Đời sống': ['furniture', 'groceries', 'home-decoration', 'kitchen-accessories'],
    'Thể thao & Xe': ['sports-accessories', 'motorcycle', 'vehicle']
  };

  const parentMap = new Map();

  for (const [parentName, children] of Object.entries(categoryGroups)) {
    const parentSlug = parentName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const parentCategory = await prisma.category.create({
      data: {
        name: parentName,
        slug: parentSlug,
      }
    });
    parentMap.set(parentName, parentCategory.id);
  }

  // Khác thì cho vào mục Khác
  const otherCategory = await prisma.category.create({
    data: { name: 'Khác', slug: 'khac' }
  });

  const categories = [...new Set(dummyData.map((p: any) => p.category))];
  const categoryMap = new Map();
  
  for (const cat of categories) {
    const slug = String(cat).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const vietnameseMap: Record<string, string> = {
      'smartphones': 'Điện thoại',
      'laptops': 'Laptop',
      'mobile-accessories': 'Phụ kiện điện thoại',
      'tablets': 'Máy tính bảng',
      'mens-shirts': 'Áo nam',
      'mens-shoes': 'Giày nam',
      'mens-watches': 'Đồng hồ nam',
      'womens-bags': 'Túi xách nữ',
      'womens-dresses': 'Váy nữ',
      'womens-jewellery': 'Trang sức nữ',
      'womens-shoes': 'Giày nữ',
      'womens-watches': 'Đồng hồ nữ',
      'sunglasses': 'Kính râm',
      'tops': 'Áo nữ',
      'beauty': 'Mỹ phẩm',
      'fragrances': 'Nước hoa',
      'skin-care': 'Chăm sóc da',
      'furniture': 'Nội thất',
      'groceries': 'Tạp hóa',
      'home-decoration': 'Đồ trang trí',
      'kitchen-accessories': 'Phụ kiện bếp',
      'sports-accessories': 'Phụ kiện thể thao',
      'motorcycle': 'Xe máy',
      'vehicle': 'Phương tiện'
    };
    let name = vietnameseMap[String(cat)] || String(cat).replace(/-/g, ' ');
    if (!vietnameseMap[String(cat)]) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    // Tìm parent
    let parentId = otherCategory.id;
    for (const [parentName, children] of Object.entries(categoryGroups)) {
      if (children.includes(String(cat))) {
        parentId = parentMap.get(parentName);
        break;
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name,
        slug: slug,
        parent_id: parentId
      }
    });
    categoryMap.set(cat, category.id);
  }

  console.log("Seeding Products...");
  const createdProducts = [];
  for (const p of dummyData) {
    const priceVnd = Math.round(p.price * 25000);
    const slug = String(p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + p.id;
    const imagesData = (p.images || []).map((url: string, index: number) => ({
      url,
      is_primary: index === 0,
      sort_order: index + 1
    }));
    
    if (imagesData.length === 0 && p.thumbnail) {
      imagesData.push({ url: p.thumbnail, is_primary: true, sort_order: 1 });
    }

    try {
      const product = await prisma.product.create({
        data: {
          name: p.title,
          slug: slug,
          description: p.description,
          category_id: categoryMap.get(p.category),
          is_active: true,
          variants: {
            create: [
              { attributes: { default: true }, price: priceVnd, stock_quantity: p.stock || 100 }
            ]
          },
          images: {
            create: imagesData
          }
        }
      });
      createdProducts.push(product);
    } catch (e) {
      console.log('Skipped duplicate or error product:', p.title);
    }
  }

  console.log(`Created ${createdProducts.length} products.`);

  console.log("Seeding Promotions...");
  const promo1 = await prisma.promotion.create({
    data: {
      code: "WELCOME2024",
      name: "Sale Chào Bạn Mới (Giảm 10%)",
      discount_type: DiscountType.PERCENT,
      discount_value: 10,
      min_order_value: 0,
      usage_limit: null,
      valid_from: new Date(Date.now() - 86400000),
      valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      is_active: true,
    },
  });

  const promo2 = await prisma.promotion.create({
    data: {
      code: "FLASH_SALE",
      name: "Flash Sale Giảm 50k",
      discount_type: DiscountType.FIXED,
      discount_value: 50000,
      min_order_value: 0,
      usage_limit: null,
      valid_from: new Date(Date.now() - 86400000),
      valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      is_active: true,
    },
  });

  console.log("Linking Promotions to Items...");
  await prisma.promotionItem.createMany({
    data: createdProducts.slice(0, 20).map(p => ({ promotion_id: promo1.id, product_id: p.id }))
  });

  await prisma.promotionItem.createMany({
    data: createdProducts.slice(20, 40).map(p => ({ promotion_id: promo2.id, product_id: p.id }))
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
