import { prisma } from '../config/prisma';
import { NotFoundError, ConflictError } from '../exceptions/AppError';
import { slugify } from '../utils/slugify';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';

/** Đảm bảo slug không trùng — nếu trùng thì thêm hậu tố -2, -3... */
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let counter = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export class CategoryService {
  /** Lấy toàn bộ danh mục dạng phẳng (frontend tự dựng cây theo parent_id) */
  async getAll() {
    return prisma.category.findMany({
      orderBy: { created_at: 'asc' },
    });
  }

  /** Lấy toàn bộ danh mục dạng cây (tree) */
  async getTree() {
    const categories = await prisma.category.findMany({
      orderBy: { created_at: 'asc' },
    });

    const categoryMap = new Map();
    const tree: any[] = [];

    categories.forEach(cat => categoryMap.set(cat.id, { ...cat, children: [] }));

    categories.forEach(cat => {
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(cat.id));
        }
      } else {
        tree.push(categoryMap.get(cat.id));
      }
    });

    return tree;
  }


  async getById(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Không tìm thấy danh mục');
    return category;
  }

  async create(input: CreateCategoryInput) {
    if (input.parent_id) {
      const parent = await prisma.category.findUnique({ where: { id: input.parent_id } });
      if (!parent) throw new NotFoundError('Danh mục cha không tồn tại');
    }

    const slug = await generateUniqueSlug(input.name);

    return prisma.category.create({
      data: {
        name: input.name,
        slug,
        parent_id: input.parent_id ?? null,
      },
    });
  }

  async update(id: string, input: UpdateCategoryInput) {
    const category = await this.getById(id);

    if (input.parent_id) {
      if (input.parent_id === id) {
        throw new ConflictError('Danh mục không thể là cha của chính nó');
      }
      const parent = await prisma.category.findUnique({ where: { id: input.parent_id } });
      if (!parent) throw new NotFoundError('Danh mục cha không tồn tại');
    }

    const slug = input.name ? await generateUniqueSlug(input.name, id) : category.slug;

    return prisma.category.update({
      where: { id },
      data: {
        name: input.name ?? category.name,
        slug,
        parent_id: input.parent_id === undefined ? category.parent_id : input.parent_id,
      },
    });
  }

  async remove(id: string) {
    await this.getById(id);

    const productCount = await prisma.product.count({ where: { category_id: id } });
    if (productCount > 0) {
      throw new ConflictError(
        `Không thể xóa danh mục vì đang có ${productCount} sản phẩm thuộc danh mục này`
      );
    }

    const childCount = await prisma.category.count({ where: { parent_id: id } });
    if (childCount > 0) {
      throw new ConflictError('Không thể xóa danh mục vì đang có danh mục con bên trong');
    }

    await prisma.category.delete({ where: { id } });
  }
}
