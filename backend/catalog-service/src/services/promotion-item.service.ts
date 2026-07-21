import { PrismaClient, PromotionItem } from '@prisma/client';
import { CreatePromotionItemInput } from '../schemas/promotion-item.schema';
import { NotFoundError, BadRequestError } from '../exceptions/AppError';

const prisma = new PrismaClient();

export class PromotionItemService {
  async getByPromotionId(promotion_id: string): Promise<PromotionItem[]> {
    return prisma.promotionItem.findMany({
      where: { promotion_id },
      include: {
        product: true,
        variant: true,
      }
    });
  }

  async create(data: CreatePromotionItemInput): Promise<PromotionItem> {
    const promotion = await prisma.promotion.findUnique({
      where: { id: data.promotion_id },
    });

    if (!promotion) {
      throw new NotFoundError();
    }

    if (data.product_id) {
      const product = await prisma.product.findUnique({ where: { id: data.product_id } });
      if (!product) throw new NotFoundError();
    }

    if (data.variant_id) {
      const variant = await prisma.productVariant.findUnique({ where: { id: data.variant_id } });
      if (!variant) throw new NotFoundError();
    }

    // Check if already exists
    const existing = await prisma.promotionItem.findFirst({
      where: {
        promotion_id: data.promotion_id,
        product_id: data.product_id || null,
        variant_id: data.variant_id || null,
      },
    });

    if (existing) {
      throw new BadRequestError();
    }

    return prisma.promotionItem.create({
      data: {
        promotion_id: data.promotion_id,
        product_id: data.product_id,
        variant_id: data.variant_id,
      },
      include: {
        product: true,
        variant: true,
      }
    });
  }

  async remove(id: string): Promise<void> {
    try {
      await prisma.promotionItem.delete({ where: { id: BigInt(id) } });
    } catch (error) {
      throw new NotFoundError();
    }
  }
}
