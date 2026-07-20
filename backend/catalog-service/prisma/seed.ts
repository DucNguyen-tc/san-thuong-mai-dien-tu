import { PrismaClient, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.stockReservation.deleteMany();
  await prisma.promotionItem.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  console.log('Seeding Categories...');
  const categoriesData = [
    { name: 'Điện thoại & Máy tính bảng', slug: 'dien-thoai-may-tinh-bang' },
    { name: 'Laptop & Thiết bị IT', slug: 'laptop-thiet-bi-it' },
    { name: 'Phụ kiện công nghệ', slug: 'phu-kien-cong-nghe' },
    { name: 'Tivi & Thiết bị giải trí', slug: 'tivi-thiet-bi-giai-tri' },
    { name: 'Thời trang nam', slug: 'thoi-trang-nam' },
    { name: 'Thời trang nữ', slug: 'thoi-trang-nu' },
    { name: 'Đồ gia dụng & Nhà cửa', slug: 'do-gia-dung-nha-cua' },
    { name: 'Sách & Văn phòng phẩm', slug: 'sach-van-phong-pham' },
    { name: 'Mỹ phẩm & Làm đẹp', slug: 'my-pham-lam-dep' },
    { name: 'Sức khỏe & Thực phẩm', slug: 'suc-khoe-thuc-pham' },
    { name: 'Đồ chơi & Mẹ bé', slug: 'do-choi-me-be' },
    { name: 'Giày dép & Túi xách', slug: 'giay-dep-tui-xach' },
    { name: 'Đồng hồ & Trang sức', slug: 'dong-ho-trang-suc' },
    { name: 'Thể thao & Dã ngoại', slug: 'the-thao-da-ngoai' },
    { name: 'Xe cộ & Phụ kiện xe', slug: 'xe-co-phu-kien-xe' },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories.push(created);
  }

  console.log('Seeding Products, Variants and Images...');
  const productsData = [
    {
      name: 'iPhone 15 Pro Max 256GB',
      slug: 'iphone-15-pro-max-256gb',
      description: 'Siêu phẩm iPhone 15 Pro Max với khung viền Titan siêu bền, chip A17 Pro mạnh mẽ vượt trội.',
      categoryIdx: 0,
      variants: [
        { attributes: { color: 'Titan tự nhiên', storage: '256GB' }, price: 29990000, stock: 50 },
        { attributes: { color: 'Titan xanh', storage: '256GB' }, price: 28990000, stock: 30 },
      ],
      images: ['https://picsum.photos/400/400?random=1', 'https://picsum.photos/400/400?random=2']
    },
    {
      name: 'MacBook Air M2 2023 15 inch',
      slug: 'macbook-air-m2-2023-15-inch',
      description: 'Laptop siêu mỏng nhẹ của Apple với màn hình Liquid Retina 15.3 inch sắc nét, hiệu năng chip M2 ấn tượng.',
      categoryIdx: 1,
      variants: [
        { attributes: { color: 'Xám không gian', ram: '8GB', ssd: '256GB' }, price: 26990000, stock: 20 },
        { attributes: { color: 'Vàng ánh sao', ram: '16GB', ssd: '512GB' }, price: 34990000, stock: 15 },
      ],
      images: ['https://picsum.photos/400/400?random=3']
    },
    {
      name: 'Chuột Gaming không dây Logitech G Pro X Superlight',
      slug: 'chuot-gaming-khong-day-logitech-g-pro-x-superlight',
      description: 'Chuột chơi game siêu nhẹ 63g, mắt đọc Hero 25K cực nhạy, kết nối không dây Lightspeed siêu ổn định.',
      categoryIdx: 2,
      variants: [
        { attributes: { color: 'Đen' }, price: 2890000, stock: 100 },
        { attributes: { color: 'Trắng' }, price: 2890000, stock: 80 },
      ],
      images: ['https://picsum.photos/400/400?random=4']
    },
    {
      name: 'Smart Tivi Coocaa 4K 55 inch',
      slug: 'smart-tivi-coocaa-4k-55-inch',
      description: 'Tivi thông minh chạy Google TV, âm thanh Dolby Audio, hình ảnh 4K HDR rực rỡ.',
      categoryIdx: 3,
      variants: [
        { attributes: { screen: '55 inch' }, price: 6590000, stock: 40 },
      ],
      images: ['https://picsum.photos/400/400?random=5']
    },
    {
      name: 'Áo Khoác Nam Bomber Kaki Basic',
      slug: 'ao-khoac-nam-bomber-kaki-basic',
      description: 'Áo khoác phong cách trẻ trung, chất liệu kaki dày dặn, đứng form chuẩn đẹp.',
      categoryIdx: 4,
      variants: [
        { attributes: { color: 'Đen', size: 'L' }, price: 250000, stock: 150 },
        { attributes: { color: 'Xanh rêu', size: 'XL' }, price: 250000, stock: 120 },
      ],
      images: ['https://picsum.photos/400/400?random=6']
    },
    {
      name: 'Đầm Nữ Dáng Xoè Voan Tơ',
      slug: 'dam-nu-dang-xoe-voan-to',
      description: 'Đầm dự tiệc thanh lịch dáng xòe, lót lụa mềm mại thoải mái.',
      categoryIdx: 5,
      variants: [
        { attributes: { color: 'Hồng pastel', size: 'M' }, price: 399000, stock: 60 },
        { attributes: { color: 'Trắng tinh khôi', size: 'S' }, price: 399000, stock: 40 },
      ],
      images: ['https://picsum.photos/400/400?random=7']
    },
    {
      name: 'Nồi Chiên Không Dầu Sunhouse 6L',
      slug: 'noi-chien-khong-dau-sunhouse-6l',
      description: 'Công nghệ Rapid Air giảm 80% dầu mỡ thừa, dung tích 6 lít thích hợp cho cả gia đình.',
      categoryIdx: 6,
      variants: [
        { attributes: { volume: '6 Lít' }, price: 1250000, stock: 90 },
      ],
      images: ['https://picsum.photos/400/400?random=8']
    },
    {
      name: 'Sách Đắc Nhân Tâm (Bìa Cứng)',
      slug: 'sach-dac-nhan-tam-bia-cung',
      description: 'Cuốn sách bán chạy nhất mọi thời đại giúp thay đổi tư duy và cải thiện các mối quan hệ xã hội.',
      categoryIdx: 7,
      variants: [
        { attributes: { version: 'Bìa cứng đặc biệt' }, price: 110000, stock: 200 },
      ],
      images: ['https://picsum.photos/400/400?random=9']
    },
    {
      name: 'Kem Chống Nắng La Roche-Posay Anthelios 50ml',
      slug: 'kem-chong-nang-la-rooche-posay-anthelios-50ml',
      description: 'Kem chống nắng kiểm soát dầu cực tốt, chỉ số chống nắng SPF 50+, an toàn cho da nhạy cảm.',
      categoryIdx: 8,
      variants: [
        { attributes: { volume: '50ml' }, price: 380000, stock: 150 },
      ],
      images: ['https://picsum.photos/400/400?random=10']
    },
    {
      name: 'Yến Sào Khánh Hoà Nguyên Chất 100g',
      slug: 'yen-sao-khanh-hoa-nguyen-chat-100g',
      description: 'Tổ yến tinh chế chất lượng cao, bồi bổ sức khỏe cho cả gia đình.',
      categoryIdx: 9,
      variants: [
        { attributes: { weight: '100g' }, price: 3200000, stock: 15 },
      ],
      images: ['https://picsum.photos/400/400?random=11']
    },
    {
      name: 'Đồ Chơi Lego Lắp Ráp Xe Đua Technic',
      slug: 'do-choi-lego-lap-rap-xe-dua-technic',
      description: 'Bộ lắp ráp xe đua thể thao năng động kích thích óc sáng tạo cho bé từ 8 tuổi trở lên.',
      categoryIdx: 10,
      variants: [
        { attributes: { model: 'Sports Car' }, price: 850000, stock: 25 },
      ],
      images: ['https://picsum.photos/400/400?random=12']
    },
    {
      name: 'Giày Thể Thao Nam Sneaker Ultraboost',
      slug: 'giay-the-thao-nam-sneaker-ultraboost',
      description: 'Giày nam đi cảnh, chạy bộ siêu êm ái, đế cao su chống trượt tốt.',
      categoryIdx: 11,
      variants: [
        { attributes: { color: 'Đen tuyền', size: '42' }, price: 1850000, stock: 70 },
        { attributes: { color: 'Trắng xám', size: '41' }, price: 1850000, stock: 50 },
      ],
      images: ['https://picsum.photos/400/400?random=13']
    },
    {
      name: 'Đồng Hồ Nam Thể Thao Casio G-Shock',
      slug: 'dong-ho-nam-the-thao-casio-g-shock',
      description: 'Chống sốc cực tốt, chống nước sâu 200m, đèn LED siêu sáng thích hợp dã ngoại ngoài trời.',
      categoryIdx: 12,
      variants: [
        { attributes: { color: 'Đen mờ' }, price: 2950000, stock: 35 },
      ],
      images: ['https://picsum.photos/400/400?random=14']
    },
    {
      name: 'Lều Dã Ngoại Tự Bung 3-4 Người',
      slug: 'leu-da-ngoai-tu-bung-3-4-nguoi',
      description: 'Lều tự bung lắp đặt nhanh trong 30 giây, chống mưa chống nắng chống côn trùng hiệu quả.',
      categoryIdx: 13,
      variants: [
        { attributes: { capacity: '3-4 Người' }, price: 650000, stock: 30 },
      ],
      images: ['https://picsum.photos/400/400?random=15']
    },
    {
      name: 'Mũ Bảo Hiểm 3/4 Đầu Có Kính Chống Chói',
      slug: 'mu-bao-hiem-3-4-dau-co-kinh-chong-choi',
      description: 'Thiết kế cá tính, bảo vệ tối ưu phần đầu khi đi xe máy, kính ngoài lọc tia cực tím tốt.',
      categoryIdx: 14,
      variants: [
        { attributes: { color: 'Đen nhám', size: 'XL' }, price: 380000, stock: 65 },
      ],
      images: ['https://picsum.photos/400/400?random=16']
    }
  ];

  const variantsList = [];
  const productsList = [];

  for (const prod of productsData) {
    const createdProduct = await prisma.product.create({
      data: {
        category_id: categories[prod.categoryIdx].id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
      }
    });

    productsList.push(createdProduct);

    // Create Variants & Images
    for (const vari of prod.variants) {
      const createdVariant = await prisma.productVariant.create({
        data: {
          product_id: createdProduct.id,
          attributes: vari.attributes,
          price: vari.price,
          stock_quantity: vari.stock,
        }
      });
      variantsList.push(createdVariant);

      // Create Images linked to Product and Variant
      for (let i = 0; i < prod.images.length; i++) {
        await prisma.productImage.create({
          data: {
            product_id: createdProduct.id,
            variant_id: createdVariant.id,
            url: prod.images[i],
            is_primary: i === 0,
            sort_order: i,
          }
        });
      }
    }
  }

  console.log('Seeding Promotions and Items...');
  const promotionsData = [
    {
      name: 'Siêu Sale Hè Rực Rỡ',
      discount_type: DiscountType.PERCENT,
      discount_value: 15,
      valid_from: new Date(),
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
    },
    {
      name: 'Giảm giá Flash Sale Cuối Tuần',
      discount_type: DiscountType.FIXED,
      discount_value: 500000,
      valid_from: new Date(),
      valid_to: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
    }
  ];

  for (const promo of promotionsData) {
    const createdPromo = await prisma.promotion.create({ data: promo });

    // Link a few products and variants to promotions
    // Promotion 1 links to index 0, 1 (Tech devices)
    if (promo.discount_type === DiscountType.PERCENT) {
      await prisma.promotionItem.create({
        data: {
          promotion_id: createdPromo.id,
          product_id: productsList[0].id,
        }
      });
      await prisma.promotionItem.create({
        data: {
          promotion_id: createdPromo.id,
          product_id: productsList[1].id,
        }
      });
    } else {
      // Promotion 2 links to variant 0 of iPhone
      await prisma.promotionItem.create({
        data: {
          promotion_id: createdPromo.id,
          variant_id: variantsList[0].id,
        }
      });
    }
  }

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
