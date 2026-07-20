import { prisma } from '../config/prisma';
import { NotFoundError } from '../exceptions/AppError';
import { slugify } from '../utils/slugify';
import {
  CreateProductInput,
  UpdateProductInput,
} from '../schemas/product.schema';

const productInclude = {
  category: true,
  variants: true,
  images: true,
};

export interface ListProductsParams {
  page: number;
  limit: number;
  category_id?: string;
  search?: string;
  includeInactive?: boolean;
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export class ProductService {
  /** Danh sách sản phẩm — hỗ trợ phân trang, lọc theo danh mục, tìm theo tên */
  async getAll(params: ListProductsParams) {
    const { page, limit, category_id, search, includeInactive } = params;

    const where = {
      ...(includeInactive ? {} : { is_active: true }),
      ...(category_id ? { category_id } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
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
    const product = await prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) throw new NotFoundError('Không tìm thấy sản phẩm');
    return product;
  }

  async create(input: CreateProductInput) {
    const category = await prisma.category.findUnique({ where: { id: input.category_id } });
    if (!category) throw new NotFoundError('Danh mục không tồn tại');

    const slug = await generateUniqueSlug(input.name);

    return prisma.product.create({
      data: {
        category_id: input.category_id,
        name: input.name,
        slug,
        description: input.description,
        is_active: input.is_active,
        variants: { create: input.variants },
        images: { create: input.images },
      },
      include: productInclude,
    });
  }

  async update(id: string, input: UpdateProductInput) {
    const product = await this.getById(id);

    if (input.category_id) {
      const category = await prisma.category.findUnique({ where: { id: input.category_id } });
      if (!category) throw new NotFoundError('Danh mục không tồn tại');
    }

    const slug = input.name ? await generateUniqueSlug(input.name, id) : product.slug;

    return prisma.product.update({
      where: { id },
      data: {
        category_id: input.category_id ?? product.category_id,
        name: input.name ?? product.name,
        slug,
        description: input.description ?? product.description,
        is_active: input.is_active ?? product.is_active,
      },
      include: productInclude,
    });
  }

  /** Soft delete — theo đúng nguyên tắc thiết kế DB (tránh ID mồ côi ở Cart/Order) */
  async remove(id: string) {
    await this.getById(id);
    await prisma.product.update({ where: { id }, data: { is_active: false } });
  }
}
