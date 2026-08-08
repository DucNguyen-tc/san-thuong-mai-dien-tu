import { ProductService } from '../services/product.service';

jest.mock('../config/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  }
}));

describe('Catalog Service - Product Service Unit Tests', () => {
  let service: ProductService;
  const { prisma } = require('../config/prisma');

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductService();
  });

  test('getAll phải phân trang và trả về danh sách sản phẩm cùng pagination info', async () => {
    const mockProducts = [
      { id: 'prod-1', name: 'Áo thun nam', price: 150000, category_id: 'cat-1', variants: [] },
      { id: 'prod-2', name: 'Quần jean nam', price: 350000, category_id: 'cat-1', variants: [] }
    ];

    prisma.$transaction.mockResolvedValue([mockProducts, 2]);

    const result = await service.getAll({ page: 1, limit: 10 });

    expect(result.items.length).toBe(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.totalPages).toBe(1);
  });

  test('getById phải báo lỗi NotFoundError nếu sản phẩm không tồn tại', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.getById('non-existent-id'))
      .rejects.toThrow('Không tìm thấy sản phẩm');
  });

  test('create phải sinh ra slug độc nhất và khởi tạo sản phẩm', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Thời trang' });
    prisma.product.findUnique.mockResolvedValue(null); // Slug không bị trùng
    prisma.product.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'prod-new', ...data }));

    const input = {
      name: 'Áo sơ mi nam công sở',
      description: 'Áo sơ mi vải lụa thoáng mát',
      category_id: '550e8400-e29b-41d4-a716-446655440000',
      is_active: true,
      variants: [
        {
          attributes: { color: 'White', size: 'M' },
          price: 250000,
          stock_quantity: 50,
          is_active: true
        }
      ],
      images: [
        { url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg', is_primary: true, sort_order: 0 }
      ]
    };

    const result = await service.create(input);

    expect(result.slug).toBe('ao-so-mi-nam-cong-so');
    expect(prisma.product.create).toHaveBeenCalled();
  });
});
