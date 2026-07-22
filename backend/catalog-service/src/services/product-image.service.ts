import { PrismaClient, ProductImage } from '@prisma/client';
import { CreateProductImageInput, UpdateProductImageInput } from '../schemas/product-image.schema';
import { NotFoundError, BadRequestError } from '../exceptions/AppError';

const prisma = new PrismaClient();

export class ProductImageService {
  async getByProductId(product_id: string): Promise<ProductImage[]> {
    return prisma.productImage.findMany({
      where: { product_id },
      orderBy: { sort_order: 'asc' },
    });
  }

  async create(data: CreateProductImageInput): Promise<ProductImage> {
    const product = await prisma.product.findUnique({
      where: { id: data.product_id },
    });

    if (!product) {
      throw new NotFoundError();
    }

    if (data.variant_id) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: data.variant_id },
      });
      if (!variant || variant.product_id !== data.product_id) {
        throw new NotFoundError();
      }
    }

    // Nếu ảnh này là primary, set các ảnh cũ thành false
    if (data.is_primary) {
      await prisma.productImage.updateMany({
        where: { product_id: data.product_id, variant_id: data.variant_id || null },
        data: { is_primary: false },
      });
    }

    return prisma.productImage.create({
      data: {
        product_id: data.product_id,
        variant_id: data.variant_id,
        url: data.url,
        is_primary: data.is_primary,
        sort_order: data.sort_order,
      },
    });
  }

  async update(id: string, data: UpdateProductImageInput): Promise<ProductImage> {
    const image = await prisma.productImage.findUnique({ where: { id: BigInt(id) } });
    if (!image) {
      throw new NotFoundError();
    }

    if (data.is_primary) {
      await prisma.productImage.updateMany({
        where: { product_id: image.product_id, variant_id: image.variant_id },
        data: { is_primary: false },
      });
    }

    return prisma.productImage.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async remove(id: string): Promise<void> {
    try {
      await prisma.productImage.delete({ where: { id: BigInt(id) } });
    } catch (error) {
      throw new NotFoundError();
    }
  }
}
