import { prisma } from '../config/prisma';
import { NotFoundError, ConflictError } from '../exceptions/AppError';
import { CreatePromotionInput, UpdatePromotionInput } from '../schemas/promotion.schema';
import { publishProductEvent } from '../rabbitmq/publisher';
import { productInclude } from './product.service';

export class PromotionService {
  async getAll() {
    return prisma.promotion.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async getById(id: string) {
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!promotion) throw new NotFoundError('Không tìm thấy khuyến mãi');
    return promotion;
  }

  async create(input: CreatePromotionInput) {
    const existing = await prisma.promotion.findUnique({ where: { code: input.code } });
    if (existing) throw new ConflictError('Mã khuyến mãi đã tồn tại');

    return prisma.promotion.create({
      data: {
        code: input.code,
        name: input.name,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        min_order_value: input.min_order_value ?? null,
        usage_limit: input.usage_limit ?? null,
        valid_from: new Date(input.valid_from),
        valid_to: new Date(input.valid_to),
        is_active: input.is_active ?? true,
      },
    });
  }

  async update(id: string, input: UpdatePromotionInput) {
    await this.getById(id);

    if (input.code) {
      const existing = await prisma.promotion.findUnique({ where: { code: input.code } });
      if (existing && existing.id !== id) {
        throw new ConflictError('Mã khuyến mãi đã tồn tại');
      }
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        code: input.code,
        name: input.name,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        min_order_value: input.min_order_value === undefined ? undefined : input.min_order_value,
        usage_limit: input.usage_limit === undefined ? undefined : input.usage_limit,
        valid_from: input.valid_from ? new Date(input.valid_from) : undefined,
        valid_to: input.valid_to ? new Date(input.valid_to) : undefined,
        is_active: input.is_active,
      },
    });

    // Đồng bộ lại các sản phẩm thuộc promotion này sang Search Service (Elasticsearch)
    try {
      const items = await prisma.promotionItem.findMany({
        where: { promotion_id: id, product_id: { not: null } },
        select: { product_id: true },
        distinct: ['product_id'],
      });
      const productIds = items.map(i => i.product_id).filter((pid): pid is string => Boolean(pid));
      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          include: productInclude,
        });
        for (const prod of products) {
          publishProductEvent('product.updated', prod);
        }
      }
    } catch (err) {
      console.error('[PromotionService] Lỗi đồng bộ event product.updated:', err);
    }

    return updated;
  }

  async remove(id: string) {
    await this.getById(id);

    // Lấy danh sách sản phẩm bị ảnh hưởng trước khi xóa
    let productIds: string[] = [];
    try {
      const items = await prisma.promotionItem.findMany({
        where: { promotion_id: id, product_id: { not: null } },
        select: { product_id: true },
        distinct: ['product_id'],
      });
      productIds = items.map(i => i.product_id).filter((pid): pid is string => Boolean(pid));
    } catch (err) {
      console.error('[PromotionService] Lỗi lấy product_id khi xóa promotion:', err);
    }

    await prisma.promotion.delete({ where: { id } });

    // Đồng bộ lại các sản phẩm sau khi gỡ khuyến mãi
    if (productIds.length > 0) {
      try {
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          include: productInclude,
        });
        for (const prod of products) {
          publishProductEvent('product.updated', prod);
        }
      } catch (err) {
        console.error('[PromotionService] Lỗi đồng bộ event product.updated sau khi xóa promotion:', err);
      }
    }
  }

  async addItemToPromotion(promotionId: string, productId: string) {
    await this.getById(promotionId);
    
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Không tìm thấy sản phẩm');

    // Kiểm tra xem đã tồn tại item này chưa
    const existing = await prisma.promotionItem.findFirst({
      where: { promotion_id: promotionId, product_id: productId }
    });
    
    let result = existing;
    if (!existing) {
      result = await prisma.promotionItem.create({
        data: {
          promotion_id: promotionId,
          product_id: productId
        }
      });
    }

    // Phát event đồng bộ sang Search Service
    try {
      const reloaded = await prisma.product.findUnique({
        where: { id: productId },
        include: productInclude,
      });
      if (reloaded) {
        publishProductEvent('product.updated', reloaded);
      }
    } catch (err) {
      console.error('[PromotionService] Lỗi phát event product.updated:', err);
    }

    return result;
  }

  async addItemsByCategory(promotionId: string, categoryId: string) {
    await this.getById(promotionId);
    
    // Lấy tất cả danh mục con
    const allCategories = await prisma.category.findMany();
    const getDescendants = (id: string): string[] => {
      const children = allCategories.filter(c => c.parent_id === id).map(c => c.id);
      return [id, ...children.flatMap(getDescendants)];
    };
    
    const categoryIds = getDescendants(categoryId);
    
    // Tìm tất cả sản phẩm thuộc các danh mục này (kèm theo biến thể)
    const products = await prisma.product.findMany({
      where: { category_id: { in: categoryIds } },
      select: { id: true, variants: { select: { id: true } } }
    });

    if (products.length === 0) {
      return { count: 0 };
    }

    // Lấy danh sách sản phẩm/biến thể đã có trong khuyến mãi để tránh trùng lặp
    const existingItems = await prisma.promotionItem.findMany({
      where: { promotion_id: promotionId, product_id: { in: products.map(p => p.id) } },
      select: { product_id: true, variant_id: true }
    });
    
    const existingProductIds = new Set(
      existingItems.filter(i => i.product_id && !i.variant_id).map(item => item.product_id)
    );
    const existingVariantIds = new Set(
      existingItems.filter(i => i.variant_id).map(item => item.variant_id)
    );
    
    // Tạo danh sách các dòng cần insert (gồm cả product và variant)
    const newItemsData: { promotion_id: string, product_id: string, variant_id?: string }[] = [];
    
    for (const product of products) {
      if (!existingProductIds.has(product.id)) {
        newItemsData.push({
          promotion_id: promotionId,
          product_id: product.id
        });
      }
      
      for (const variant of product.variants) {
        if (!existingVariantIds.has(variant.id)) {
          newItemsData.push({
            promotion_id: promotionId,
            product_id: product.id,
            variant_id: variant.id
          });
        }
      }
    }

    let insertCount = 0;
    if (newItemsData.length > 0) {
      const result = await prisma.promotionItem.createMany({
        data: newItemsData,
        skipDuplicates: true
      });
      insertCount = result.count;
    }

    // Phát event RabbitMQ product.updated cho từng sản phẩm thuộc danh mục để Search Service (Elasticsearch) cập nhật giá khuyến mãi ngay lập tức
    try {
      const updatedProducts = await prisma.product.findMany({
        where: { id: { in: products.map(p => p.id) } },
        include: productInclude,
      });

      for (const prod of updatedProducts) {
        publishProductEvent('product.updated', prod);
      }
      console.log(`[PromotionService] Đã phát event product.updated cho ${updatedProducts.length} sản phẩm thuộc danh mục ${categoryId}`);
    } catch (err) {
      console.error('[PromotionService] Lỗi phát event bulk product.updated:', err);
    }

    return { count: insertCount };
  }
}
