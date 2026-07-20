import { PrismaClient, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.promotion.deleteMany();

  console.log('Seeding Categories...');
  
  const electronics = await prisma.category.create({
    data: {
      name: 'Điện tử',
      slug: 'dien-tu',
    }
  });

  const phones = await prisma.category.create({
    data: {
      name: 'Điện thoại',
      slug: 'dien-thoai',
      parent_id: electronics.id,
    }
  });

  const laptops = await prisma.category.create({
    data: {
      name: 'Laptop',
      slug: 'laptop',
      parent_id: electronics.id,
    }
  });

  console.log('Seeding Products...');

  const iphone = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      description: 'Điện thoại cao cấp của Apple năm 2023.',
      category_id: phones.id,
      is_active: true,
      variants: {
        create: [
          {
            attributes: { color: 'Titan Tự Nhiên', storage: '256GB' },
            price: 28990000,
            stock_quantity: 50,
          },
          {
            attributes: { color: 'Titan Đen', storage: '256GB' },
            price: 28590000,
            stock_quantity: 20,
          }
        ]
      },
      images: {
        create: [
          {
            url: 'https://shopdunk.com/images/thumbs/0022265_iphone-15-pro-max-256gb_550.png',
            is_primary: true,
            sort_order: 1
          }
        ]
      }
    }
  });

  const macbook = await prisma.product.create({
    data: {
      name: 'MacBook Pro 14 M3',
      slug: 'macbook-pro-14-m3',
      description: 'Laptop chuyên nghiệp cho dân thiết kế, lập trình.',
      category_id: laptops.id,
      is_active: true,
      variants: {
        create: [
          {
            attributes: { color: 'Silver', ram: '18GB', storage: '512GB' },
            price: 39990000,
            stock_quantity: 15,
          }
        ]
      },
      images: {
        create: [
          {
            url: 'https://shopdunk.com/images/thumbs/0022421_macbook-pro-14-inch-m3-2023_550.png',
            is_primary: true,
            sort_order: 1
          }
        ]
      }
    }
  });

  console.log('Seeding Promotions...');

  await prisma.promotion.create({
    data: {
      code: 'WELCOME2024',
      name: 'Chào bạn mới',
      discount_type: DiscountType.PERCENT,
      discount_value: 10,
      min_order_value: 500000,
      usage_limit: 1000,
      valid_from: new Date(),
      valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      is_active: true,
    }
  });

  await prisma.promotion.create({
    data: {
      code: 'GIAM500K',
      name: 'Giảm 500K cho đơn từ 20 triệu',
      discount_type: DiscountType.FIXED,
      discount_value: 500000,
      min_order_value: 20000000,
      usage_limit: 500,
      valid_from: new Date(),
      valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      is_active: true,
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
