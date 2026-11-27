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

  // Kiểm tra khuyến mãi đang hoạt động (hỗ trợ cả cấu trúc Prisma promotion lẫn raw reindex)
  const now = new Date();
  const activePromotions = (product.promotions || []).filter((p: any) => {
    const promo = p.promotion || p;
    if (!promo || promo.is_active === false) return false;
    if (promo.valid_from && new Date(promo.valid_from) > now) return false;
    if (promo.valid_to && new Date(promo.valid_to) <= now) return false;
    return true;
  });

  let bestDiscountedPrice = minPrice;
  let maxDiscountPercent = 0;

  for (const item of activePromotions) {
    const promo = item.promotion || item;
    const discountType = String(promo.discount_type || 'PERCENT').toUpperCase();
    const discountValue = Number(promo.discount_value ?? promo.discount_percent ?? 0);

    if (discountValue <= 0) continue;

    let discountedPrice = minPrice;
    let pct = 0;

    if (discountType === 'PERCENT') {
      discountedPrice = minPrice * (1 - discountValue / 100);
      pct = Math.round(discountValue);
    } else {
      // FIXED discount (giảm số tiền cố định)
      discountedPrice = Math.max(0, minPrice - discountValue);
      pct = minPrice > 0 ? Math.round(((minPrice - discountedPrice) / minPrice) * 100) : 0;
    }

    if (discountedPrice < bestDiscountedPrice) {
      bestDiscountedPrice = discountedPrice;
    }
    if (pct > maxDiscountPercent) {
      maxDiscountPercent = pct;
    }
  }

  const hasDiscount = minPrice > 0 && bestDiscountedPrice < minPrice && maxDiscountPercent > 0;
  const finalPrice = hasDiscount ? Math.round(bestDiscountedPrice) : minPrice;
  const discountPercent = hasDiscount ? maxDiscountPercent : 0;

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

    price: finalPrice,
    original_price: minPrice,
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
  // Tái sử dụng image_vector đã có trong ES nếu có để tăng tốc index (nhất là khi cập nhật giá/khuyến mãi)
  let vectorToUse = options?.imageVector;
  if (vectorToUse === undefined && !options?.skipVector) {
    try {
      const existing = await esClient.get({
        index: env.ELASTICSEARCH_INDEX,
        id: product.id,
        _source_includes: ["image_vector"],
      }).catch(() => null);
      if (existing && (existing._source as any)?.image_vector) {
        vectorToUse = (existing._source as any).image_vector;
      }
    } catch {
      // Bỏ qua lỗi nếu chưa có document
    }
  }

  const doc = await mapProductToDocument(product, {
    ...options,
    imageVector: vectorToUse !== undefined ? vectorToUse : options?.imageVector,
  });

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
