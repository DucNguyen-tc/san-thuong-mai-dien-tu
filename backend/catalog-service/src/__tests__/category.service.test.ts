import { CategoryService } from '../services/category.service';

// Mock config/prisma
jest.mock('../config/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    }
  }
}));

describe('Catalog Service - Category Service Unit Tests', () => {
  let service: CategoryService;
  const { prisma } = require('../config/prisma');

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoryService();
  });

  test('getTree phải chuyển đổi danh sách danh mục phẳng thành cấu trúc cây Parent-Child', async () => {
    const mockFlatCategories = [
      { id: 'cat-1', name: 'Thời trang', parent_id: null, created_at: new Date() },
      { id: 'cat-2', name: 'Áo nam', parent_id: 'cat-1', created_at: new Date() },
      { id: 'cat-3', name: 'Áo thun nam', parent_id: 'cat-2', created_at: new Date() },
      { id: 'cat-4', name: 'Điện tử', parent_id: null, created_at: new Date() },
    ];

    prisma.category.findMany.mockResolvedValue(mockFlatCategories);

    const tree = await service.getTree();

    expect(tree.length).toBe(2); // 2 danh mục gốc: Thời trang, Điện tử
    expect(tree[0].id).toBe('cat-1');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].id).toBe('cat-2');
    expect(tree[0].children[0].children[0].id).toBe('cat-3');
  });

  test('create phải sinh ra slug độc nhất từ tên danh mục', async () => {
    prisma.category.findUnique.mockResolvedValue(null); // Không bị trùng slug
    prisma.category.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'cat-new', ...data }));

    const result = await service.create({ name: 'Đồng Hồ Thông Minh' });

    expect(result.slug).toBe('dong-ho-thong-minh');
    expect(prisma.category.create).toHaveBeenCalledWith({
      data: {
        name: 'Đồng Hồ Thông Minh',
        slug: 'dong-ho-thong-minh',
        parent_id: null
      }
    });
  });

  test('create phải báo lỗi NotFoundError khi parent_id không tồn tại trong DB', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(service.create({ name: 'Áo khoác', parent_id: 'non-existent-id' }))
      .rejects.toThrow('Danh mục cha không tồn tại');
  });

  test('update phải báo lỗi ConflictError khi danh mục chọn chính nó làm danh mục cha', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-1', name: 'Thời trang', slug: 'thoi-trang' });

    await expect(service.update('cat-1', { parent_id: 'cat-1' }))
      .rejects.toThrow('Danh mục không thể là cha của chính nó');
  });
});
