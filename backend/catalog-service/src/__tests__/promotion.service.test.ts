import { PromotionService } from '../services/promotion.service';

jest.mock('../config/prisma', () => ({
  prisma: {
    promotion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    promotionItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    }
  }
}));

describe('Catalog Service - Promotion Service Unit Tests', () => {
  let service: PromotionService;
  const { prisma } = require('../config/prisma');

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PromotionService();
  });

  test('create phải báo lỗi ConflictError nếu mã khuyến mãi (code) đã tồn tại', async () => {
    prisma.promotion.findUnique.mockResolvedValue({ id: 'promo-1', code: 'SUMMER2024' });

    await expect(service.create({
      code: 'SUMMER2024',
      name: 'Giảm giá mùa hè',
      discount_type: 'PERCENT',
      discount_value: 20,
      valid_from: '2024-06-01',
      valid_to: '2024-08-31'
    })).rejects.toThrow('Mã khuyến mãi đã tồn tại');
  });

  test('create phải tạo mới thành công khuyến mãi khi code chưa tồn tại', async () => {
    prisma.promotion.findUnique.mockResolvedValue(null);
    prisma.promotion.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'promo-new', ...data }));

    const result = await service.create({
      code: 'FLASH50',
      name: 'Flash Sale 50%',
      discount_type: 'PERCENT',
      discount_value: 50,
      valid_from: '2024-06-01',
      valid_to: '2024-06-02'
    });

    expect(result.code).toBe('FLASH50');
    expect(prisma.promotion.create).toHaveBeenCalled();
  });

  test('addItemToPromotion phải báo lỗi NotFoundError nếu sản phẩm không tồn tại', async () => {
    prisma.promotion.findUnique.mockResolvedValue({ id: 'promo-1', code: 'SALE10' });
    prisma.product.findUnique.mockResolvedValue(null); // Không tìm thấy SP

    await expect(service.addItemToPromotion('promo-1', 'invalid-prod-id'))
      .rejects.toThrow('Không tìm thấy sản phẩm');
  });

  test('addItemsByCategory phải tìm đúng danh mục con và thêm tất cả sản phẩm thuộc danh mục', async () => {
    prisma.promotion.findUnique.mockResolvedValue({ id: 'promo-1', code: 'SALE10' });
    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-parent', parent_id: null },
      { id: 'cat-child', parent_id: 'cat-parent' }
    ]);
    prisma.product.findMany.mockResolvedValue([
      { id: 'prod-1', category_id: 'cat-child', variants: [] },
      { id: 'prod-2', category_id: 'cat-child', variants: [{ id: 'var-1' }] }
    ]);
    prisma.promotionItem.findMany.mockResolvedValue([]);
    prisma.promotionItem.createMany.mockResolvedValue({ count: 3 }); // 2 products + 1 variant

    const result = await service.addItemsByCategory('promo-1', 'cat-parent');

    expect(result.count).toBe(3);
    expect(prisma.promotionItem.createMany).toHaveBeenCalled();
  });
});
