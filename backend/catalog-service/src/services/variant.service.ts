import { prisma } from '../config/prisma';
import { NotFoundError } from '../exceptions/AppError';
import { CreateVariantInput, UpdateVariantInput } from '../schemas/variant.schema';

export interface ListVariantsParams {
  page: number;
  limit: number;
  product_id?: string;
  includeInactive?: boolean;
}

const variantInclude = {
  product: true,
  images: true,
};

export class VariantService {
  /** Lấy danh sách biến thể — hỗ trợ phân trang, lọc theo sản phẩm */
  async getAll(params: ListVariantsParams) {
    const { page, limit, product_id, includeInactive } = params;

    const where = {
      ...(includeInactive ? {} : { is_active: true }),
      ...(product_id ? { product_id } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.productVariant.findMany({
        where,
        include: variantInclude,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productVariant.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getById(id: string) {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: variantInclude,
    });
    if (!variant) throw new NotFoundError('Không tìm thấy biến thể sản phẩm');
    return variant;
  }

  async create(input: CreateVariantInput) {
    // Kiểm tra sản phẩm cha có tồn tại không
    const product = await prisma.product.findUnique({ where: { id: input.product_id } });
    if (!product) throw new NotFoundError('Sản phẩm không tồn tại');

    return prisma.productVariant.create({
      data: {
        attributes: input.attributes ?? {},
        price: input.price,
        stock_quantity: input.stock_quantity ?? 0,
        is_active: input.is_active ?? true,
        product_id: input.product_id,
        images: input.images && input.images.length > 0 ? { create: input.images.map(img => ({ ...img, product: { connect: { id: input.product_id } } })) } : undefined
      },
      include: variantInclude,
    });
  }

  async update(id: string, input: UpdateVariantInput) {
    // Kiểm tra sự tồn tại của variant
    const variant = await this.getById(id);

    return prisma.productVariant.update({
      where: { id },
      data: {
        attributes: input.attributes ?? undefined,
        price: input.price ?? undefined,
        stock_quantity: input.stock_quantity ?? undefined,
        is_active: input.is_active ?? undefined,
        images: input.images && input.images.length > 0 ? {
          deleteMany: {},
          create: input.images.map(img => ({ ...img, product: { connect: { id: variant.product_id } } }))
        } : undefined
      },
      include: variantInclude,
    });
  }

  /** Soft delete biến thể (tắt bán), không xóa cứng để giữ lịch sử đơn hàng cũ hợp lệ */
  async remove(id: string) {
    await this.getById(id);
    await prisma.productVariant.update({
      where: { id },
      data: { is_active: false },
    });
  }

  async getBulk(variantIds: string[]) {
    if (!variantIds || variantIds.length === 0) return [];
    
    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
      },
      include: {
        images: true,
        product: {
          include: {
            images: true,
            promotions: {
              where: {
                promotion: {
                  is_active: true,
                  valid_from: { lte: new Date() },
                  valid_to: { gt: new Date() }
                }
              },
              include: {
                promotion: true
              }
            }
          }
        },
      },
    });

    // Tính toán giá sau khuyến mãi cho từng biến thể để trả về cho cart-service
    return variants.map(v => {
      let currentPrice = Number(v.price);
      if (v.product?.promotions && v.product.promotions.length > 0) {
        let bestPrice = currentPrice;
        for (const item of v.product.promotions) {
          const promo = item.promotion;
          if (promo.discount_type === 'PERCENT') {
            const p = currentPrice * (1 - Number(promo.discount_value) / 100);
            if (p < bestPrice) bestPrice = p;
          } else {
            const p = currentPrice - Number(promo.discount_value);
            if (p < bestPrice) bestPrice = p;
          }
        }
        currentPrice = Math.max(0, bestPrice);
      }
      return {
        ...v,
        price: currentPrice // Override giá bằng giá đã giảm
      };
    });
  }

  /** Cập nhật tồn kho hàng loạt (dùng cho Order Service) */
  async updateStockBulk(items: { variantId: string; quantity: number }[], action: 'deduct' | 'restore') {
    return prisma.$transaction(
      items.map((item) => {
        const adjustment = action === 'deduct' ? -item.quantity : item.quantity;
        return prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock_quantity: {
              increment: adjustment,
            },
          },
        });
      })
    );
  }
}
