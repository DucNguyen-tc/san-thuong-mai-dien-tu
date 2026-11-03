import { PrismaClient, DiscountType } from "@prisma/client";
import { CATEGORY_HIERARCHY, ProductSeedItem } from "./products_catalog_500";
import { generatePhones, generateTablets } from "./products_catalog_500";
import { generateLaptops } from "./dataset_builder";
import { generateSmartwatches, generateAudio, generateAccessories } from "./data_smartwatch_audio";
import { generateHomeAppliances, generateKitchen } from "./data_home_appliances";
import { generateAirPurifiers, generatePersonalCare } from "./data_air_and_personal";
import { generateCameras, generateActionCams, generateLenses } from "./data_cameras_gear";
import { generateMensApparel, generateWomensApparel, generateBags, generateWatchesAndJewelry } from "./data_fashion_lifestyle";
import { generateSportShoes, generateOutdoor, generateSkincare, generatePerfumes } from "./data_sports_beauty";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log("=================================================");
  console.log("   TIẾN HÀNH SEED 500+ SẢN PHẨM CHI TIẾT CHO AI   ");
  console.log("=================================================\n");

  const startTime = Date.now();

  console.log("1. Đang dọn dẹp dữ liệu cũ trong database...");
  await prisma.stockReservation.deleteMany();
  await prisma.promotionItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.promotion.deleteMany();
  console.log("-> Đã xóa sạch dữ liệu cũ thành công.\n");

  console.log("2. Đang tạo cây danh mục phân cấp (Category Hierarchy)...");
  const categoryMap = new Map<string, string>();

  for (const group of CATEGORY_HIERARCHY) {
    const parent = await prisma.category.create({
      data: {
        name: group.parent.name,
        slug: group.parent.slug
      }
    });

    for (const child of group.children) {
      const childCat = await prisma.category.create({
        data: {
          name: child.name,
          slug: child.slug,
          parent_id: parent.id
        }
      });
      categoryMap.set(child.slug, childCat.id);
    }
    console.log(`- Đã tạo danh mục cha: [${group.parent.name}] cùng ${group.children.length} danh mục con.`);
  }

  console.log("\n3. Đang thu thập và khởi tạo dữ liệu 500+ sản phẩm cấu hình chi tiết...");
  const allProductSeeds: ProductSeedItem[] = [
    ...generatePhones(),
    ...generateTablets(),
    ...generateLaptops(),
    ...generateSmartwatches(),
    ...generateAudio(),
    ...generateAccessories(),
    ...generateHomeAppliances(),
    ...generateKitchen(),
    ...generateAirPurifiers(),
    ...generatePersonalCare(),
    ...generateCameras(),
    ...generateActionCams(),
    ...generateLenses(),
    ...generateMensApparel(),
    ...generateWomensApparel(),
    ...generateBags(),
    ...generateWatchesAndJewelry(),
    ...generateSportShoes(),
    ...generateOutdoor(),
    ...generateSkincare(),
    ...generatePerfumes()
  ];

  console.log(`-> Tổng số sản phẩm chuẩn bị tạo: ${allProductSeeds.length} sản phẩm.`);

  console.log("\n4. Đang nạp sản phẩm vào cơ sở dữ liệu...");
  const createdProducts = [];
  let variantCount = 0;
  let imageCount = 0;

  for (let i = 0; i < allProductSeeds.length; i++) {
    const item = allProductSeeds[i];
    const categoryId = categoryMap.get(item.categorySlug);

    if (!categoryId) {
      console.warn(`[Cảnh báo] Không tìm thấy danh mục cho slug: ${item.categorySlug}`);
      continue;
    }

    const baseSlug = slugify(item.name);
    const uniqueSlug = `${baseSlug}-${i + 1}`;

    const imagesData = (item.images || []).map((url: string, idx: number) => ({
      url,
      is_primary: idx === 0,
      sort_order: idx + 1
    }));

    try {
      const product = await prisma.product.create({
        data: {
          name: item.name,
          slug: uniqueSlug,
          description: item.description,
          category_id: categoryId,
          is_active: true,
          variants: {
            create: item.variants.map((v) => ({
              attributes: v.attributes,
              price: v.price,
              stock_quantity: v.stock_quantity,
              stock_reserved: 0,
              is_active: true
            }))
          },
          images: {
            create: imagesData
          }
        }
      });

      createdProducts.push(product);
      variantCount += item.variants.length;
      imageCount += imagesData.length;

      if ((i + 1) % 50 === 0 || i + 1 === allProductSeeds.length) {
        console.log(`- Đã tạo: ${i + 1}/${allProductSeeds.length} sản phẩm...`);
      }
    } catch (err: any) {
      console.error(`Lỗi khi tạo sản phẩm "${item.name}":`, err.message);
    }
  }

  console.log(`\n-> Hoàn thành tạo ${createdProducts.length} sản phẩm, ${variantCount} biến thể và ${imageCount} hình ảnh.`);

  console.log("\n5. Đang tạo mã khuyến mãi và gắn vào sản phẩm...");
  const promoWelcome = await prisma.promotion.create({
    data: {
      code: "WELCOME2025",
      name: "Khuyến mãi Khách Hàng Mới (Giảm 10%)",
      discount_type: DiscountType.PERCENT,
      discount_value: 10,
      min_order_value: 500000,
      usage_limit: 10000,
      valid_from: new Date(Date.now() - 86400000),
      valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
      is_active: true
    }
  });

  const promoFlash = await prisma.promotion.create({
    data: {
      code: "FLASHSALE100K",
      name: "Flash Sale Giảm Ngay 100.000đ",
      discount_type: DiscountType.FIXED,
      discount_value: 100000,
      min_order_value: 1000000,
      usage_limit: 5000,
      valid_from: new Date(Date.now() - 86400000),
      valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
      is_active: true
    }
  });

  const promoTech = await prisma.promotion.create({
    data: {
      code: "TECHMEGA500K",
      name: "Mega Sale Đồ Công Nghệ Cao Cấp Giảm 500.000đ",
      discount_type: DiscountType.FIXED,
      discount_value: 500000,
      min_order_value: 10000000,
      usage_limit: 2000,
      valid_from: new Date(Date.now() - 86400000),
      valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
      is_active: true
    }
  });

  // Gắn sản phẩm vào chương trình khuyến mãi
  await prisma.promotionItem.createMany({
    data: createdProducts.slice(0, 50).map((p) => ({
      promotion_id: promoWelcome.id,
      product_id: p.id
    }))
  });

  await prisma.promotionItem.createMany({
    data: createdProducts.slice(50, 100).map((p) => ({
      promotion_id: promoFlash.id,
      product_id: p.id
    }))
  });

  await prisma.promotionItem.createMany({
    data: createdProducts.slice(0, 85).map((p) => ({
      promotion_id: promoTech.id,
      product_id: p.id
    }))
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n=================================================");
  console.log("           KẾT QUẢ SEED CƠ SỞ DỮ LIỆU            ");
  console.log("=================================================");
  console.log(`- Tổng số sản phẩm đã tạo : ${createdProducts.length} sản phẩm`);
  console.log(`- Tổng số biến thể (Variants): ${variantCount} biến thể`);
  console.log(`- Tổng số ảnh sản phẩm     : ${imageCount} ảnh`);
  console.log(`- Tổng số chương trình KM  : 3 chương trình`);
  console.log(`- Thời gian thực thi       : ${duration} giây`);
  console.log("=================================================\n");
}

main()
  .catch((e) => {
    console.error("Lỗi trong quá trình seed database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
