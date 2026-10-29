import { esClient } from "../config/elasticsearch";
import { env } from "../config/env";
import { generateImageVector } from "./embedding.service";

export interface IndexOptions {
  skipVector?: boolean;
  imageVector?: number[] | null;
}

/**
 * Map dữ liệu sản phẩm từ PostgreSQL/Prisma sang document Elasticsearch.
 * Hàm này đọc cấu trúc dữ liệu của catalog-service và chuẩn hóa về format ES.
 */
export async function mapProductToDocument(
  product: any,
  options?: IndexOptions,
): Promise<any> {
  // Tìm variant đang active và lấy giá thấp nhất
  const activeVariants = (product.variants || []).filter(
    (v: any) => v.is_active,
  );
  const prices = activeVariants.map((v: any) => Number(v.price) || 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  // Tìm ảnh chính của sản phẩm
  const primaryImage = (product.images || []).find(
    (img: any) => img.is_primary,
  );
  const imageUrl = primaryImage?.url || (product.images?.[0]?.url ?? "");

  // Kiểm tra khuyến mãi đang hoạt động
  const activePromotions = (product.promotions || []).filter((p: any) => {
    const promo = p.promotion;
    if (!promo || !promo.is_active) return false;
    const now = new Date();
    return new Date(promo.valid_from) <= now && new Date(promo.valid_to) > now;
  });

  const hasDiscount = activePromotions.length > 0;
  const discountPercent = hasDiscount
    ? Math.max(
        ...activePromotions.map(
          (p: any) => Number(p.promotion.discount_percent) || 0,
        ),
      )
    : 0;

  // Lấy thuộc tính từ variants (color, brand, size)
  const allAttributes: Record<string, string[]> = {};
  for (const variant of activeVariants) {
    const attrs = variant.attributes || {};
    for (const [key, value] of Object.entries(attrs)) {
      if (!allAttributes[key]) allAttributes[key] = [];
      if (value && !allAttributes[key].includes(String(value))) {
        allAttributes[key].push(String(value));
      }
    }
  }

  // Sinh image_vector từ ảnh sản phẩm (CLIP 512 dimensions)
  let imageVector: number[] | null = null;
  if (options?.imageVector !== undefined) {
    imageVector = options.imageVector;
  } else if (imageUrl && !options?.skipVector) {
    try {
      imageVector = await generateImageVector(imageUrl);
    } catch (err: any) {
      console.warn(
        `[Indexer] ⚠️ Không thể sinh image_vector cho sản phẩm ${product.name}:`,
        err?.message || err,
      );
    }
  }

  const doc: any = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || "",

    category_id: product.category?.id || product.category_id || "",
    category_name: product.category?.name || "",
    category_slug: product.category?.slug || "",
    parent_category_id: product.category?.parent_id || null,

    price: minPrice,
    original_price: minPrice, // Giai đoạn 1 chưa tính giá gốc riêng
    has_discount: hasDiscount,
    discount_percent: discountPercent,

    attributes: {
      color: allAttributes["color"] || allAttributes["Color"] || [],
      size: allAttributes["size"] || allAttributes["Size"] || [],
      brand: allAttributes["brand"] || allAttributes["Brand"] || [],
    },

    stock_quantity: activeVariants.reduce(
      (sum: number, v: any) => sum + (Number(v.stock_quantity) || 0),
      0,
    ),
    is_active: product.is_active,

    image_url: imageUrl,
    images: (product.images || []).map((img: any) => img.url),

    created_at: product.created_at,
    updated_at: product.updated_at,

    // Completion Suggester — giúp autocomplete tìm kiếm nhanh
    suggest: {
      input: [
        product.name,
        product.category?.name,
        allAttributes["brand"]?.[0],
      ].filter(Boolean), // Loại bỏ giá trị null/undefined
      weight: 10,
    },
  };

  // Gán image_vector nếu có (512 chiều)
  if (imageVector && Array.isArray(imageVector) && imageVector.length === 512) {
    doc.image_vector = imageVector;
  }

  return doc;
}

/**
 * Ghi 1 sản phẩm vào Elasticsearch (tạo mới hoặc cập nhật nếu đã tồn tại).
 * Dùng "upsert" để tránh lỗi khi cùng 1 ID được ghi nhiều lần.
 */
export async function indexProduct(
  product: any,
  options?: IndexOptions,
): Promise<void> {
  const doc = await mapProductToDocument(product, options);

  await esClient.index({
    index: env.ELASTICSEARCH_INDEX,
    id: product.id, // Dùng ID từ PostgreSQL làm document ID trong ES
    document: doc,
  });

  const hasVec = doc.image_vector ? " 🖼️ [CLIP Vector: 512d]" : "";
  console.log(`[Indexer] Đã index sản phẩm: ${product.name} (${product.id})${hasVec}`);
}

/**
 * Xóa 1 sản phẩm khỏi Elasticsearch theo ID.
 */
export async function removeProduct(productId: string): Promise<void> {
  try {
    await esClient.delete({
      index: env.ELASTICSEARCH_INDEX,
      id: productId,
    });
    console.log(`[Indexer] Đã xóa sản phẩm khỏi ES: ${productId}`);
  } catch (error: any) {
    // Nếu document không tồn tại (404) thì bỏ qua, không cần throw
    if (error?.meta?.statusCode === 404) {
      console.log(
        `[Indexer] Sản phẩm không tồn tại trong ES, bỏ qua: ${productId}`,
      );
      return;
    }
    throw error;
  }
}
