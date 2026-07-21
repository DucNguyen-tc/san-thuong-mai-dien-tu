import { prisma } from '../config/prisma';
import { NotFoundError, ConflictError } from '../exceptions/AppError';
import { CreatePromotionInput, UpdatePromotionInput } from '../schemas/promotion.schema';

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

    return prisma.promotion.update({
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
  }

  async remove(id: string) {
    await this.getById(id);
    await prisma.promotion.delete({ where: { id } });
  }
}
