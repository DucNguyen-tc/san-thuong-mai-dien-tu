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
  promotions: {
    include: {
      promotion: true
    },
    where: {
      promotion: {
        is_active: true,
        valid_from: { lte: new Date() },
        valid_to: { gt: new Date() }
      }
    }
  }
};

export interface ListProductsParams {
  page: number;
  limit: number;
  category_id?: string;
  search?: string;
  includeInactive?: boolean;
  has_discount?: boolean;
  sort?: string;
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
    const { page, limit, category_id, search, includeInactive, has_discount, sort } = params;

    let categoryIds: string[] = [];
    if (category_id) {
      const allCategories = await prisma.category.findMany({ select: { id: true, parent_id: true } });
      const getDescendants = (id: string): string[] => {
        const children = allCategories.filter(c => c.parent_id === id).map(c => c.id);
        return [id, ...children.flatMap(getDescendants)];
      };
      categoryIds = getDescendants(category_id);
    }

    const where: any = {
      ...(includeInactive ? {} : { is_active: true }),
      ...(categoryIds.length > 0 ? { category_id: { in: categoryIds } } : {}),
      ...(search 
        ? { 
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { category: { name: { contains: search, mode: 'insensitive' as const } } }
            ] 
          } 
        : {}),
    };

    if (has_discount) {
      where.promotions = {
        some: {
          promotion: {
            is_active: true,
            valid_from: { lte: new Date() },
            valid_to: { gt: new Date() }
          }
        }
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: sort === 'newest' ? { created_at: 'desc' } : { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Hỗ trợ sắp xếp theo giá (sắp xếp trên trang hiện tại để demo)
    if (sort === 'price_asc' || sort === 'price_desc') {
      items.sort((a, b) => {
        const getPrice = (prod: any) => {
          const activePrices = prod.variants.filter((v: any) => v.is_active).map((v: any) => Number(v.price) || 0);
          return activePrices.length > 0 ? Math.min(...activePrices) : 0;
        };
        const priceA = getPrice(a);
        const priceB = getPrice(b);
        return sort === 'price_asc' ? priceA - priceB : priceB - priceA;
      });
    }

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

    const newProduct = await prisma.product.create({
      data: {
        category_id: input.category_id,
        name: input.name,
        slug,
        description: input.description,
        is_active: input.is_active,
        variants: { 
          create: input.variants.map(v => ({
            attributes: v.attributes ?? {},
            price: v.price,
            stock_quantity: v.stock_quantity ?? 0,
            is_active: v.is_active ?? true
          }))
        },
        images: { create: input.images },
      },
      include: productInclude,
    });

    const variantImagesData: any[] = [];
    input.variants.forEach((v, index) => {
      if (v.images && v.images.length > 0) {
        const createdVariant = newProduct.variants[index];
        if (createdVariant) {
          v.images.forEach(img => {
            variantImagesData.push({
              product_id: newProduct.id,
              variant_id: createdVariant.id,
              url: img.url,
              is_primary: img.is_primary,
              sort_order: img.sort_order
            });
          });
        }
      }
    });
    
    if (variantImagesData.length > 0) {
      await prisma.productImage.createMany({ data: variantImagesData });
      const reloadedProduct = await prisma.product.findUnique({ where: { id: newProduct.id }, include: productInclude });
      if (reloadedProduct) {
        // publishProductEvent('product.created', reloadedProduct);
        return reloadedProduct;
      }
    }

    // publishProductEvent('product.created', newProduct);
    return newProduct;
  }

  async update(id: string, input: UpdateProductInput) {
    const product = await this.getById(id);

    if (input.category_id) {
      const category = await prisma.category.findUnique({ where: { id: input.category_id } });
      if (!category) throw new NotFoundError('Danh mục không tồn tại');
    }

    const slug = input.name ? await generateUniqueSlug(input.name, id) : product.slug;

    const updateData: any = {
      category_id: input.category_id ?? product.category_id,
      name: input.name ?? product.name,
      slug,
      description: input.description ?? product.description,
      is_active: input.is_active ?? product.is_active,
    };

    if (input.images) {
      updateData.images = {
        deleteMany: {},
        create: input.images,
      };
    }

    if (input.variants && input.variants.length > 0) {
      if (product.variants.length > 0) {
        updateData.variants = {
          update: {
            where: { id: product.variants[0].id },
            data: {
              attributes: input.variants[0].attributes ?? {},
              price: input.variants[0].price,
              stock_quantity: input.variants[0].stock_quantity ?? 0,
              is_active: input.variants[0].is_active ?? true,
            },
          }
        };
      } else {
        updateData.variants = {
          create: input.variants.map(v => ({
            attributes: v.attributes ?? {},
            price: v.price,
            stock_quantity: v.stock_quantity ?? 0,
            is_active: v.is_active ?? true,
          })),
        };
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: productInclude,
    });

    if (input.variants && input.variants.length > 0 && product.variants.length > 0) {
       const vInput = input.variants[0];
       if (vInput.images && vInput.images.length > 0) {
         await prisma.productImage.deleteMany({ where: { variant_id: product.variants[0].id } });
         await prisma.productImage.createMany({
           data: vInput.images.map(img => ({
             product_id: id,
             variant_id: product.variants[0].id,
             url: img.url,
             is_primary: img.is_primary,
             sort_order: img.sort_order
           }))
         });
       } else if (vInput.images && vInput.images.length === 0) {
         await prisma.productImage.deleteMany({ where: { variant_id: product.variants[0].id } });
       }
    }

    // publishProductEvent('product.updated', updatedProduct);
    return updatedProduct;
  }

  /** Soft delete — theo đúng nguyên tắc thiết kế DB (tránh ID mồ côi ở Cart/Order) */
  async remove(id: string) {
    await this.getById(id);
    await prisma.product.update({ where: { id }, data: { is_active: false } });
  }
}
