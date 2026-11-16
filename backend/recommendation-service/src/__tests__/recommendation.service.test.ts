import { RecommendationService } from '../services/recommendation.service';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mPrisma = {
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    $queryRawUnsafe: jest.fn(),
    recommendationLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-123' })
    }
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('Recommendation Service - Business Logic', () => {
  let service: RecommendationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecommendationService();
  });

  test('getHybridRecommendations phải gộp và tính trọng số từ Content-based và Collaborative Filtering', async () => {
    // Mock getContentBasedProducts & getCollaborativeProducts
    jest.spyOn(service, 'getContentBasedProducts').mockResolvedValue([
      { id: 'prod-A', score: 0.9 },
      { id: 'prod-B', score: 0.8 }
    ]);
    jest.spyOn(service, 'getCollaborativeProducts').mockResolvedValue([
      { id: 'prod-B', score: 1.0 },
      { id: 'prod-C', score: 0.5 }
    ]);

    const results = await service.getHybridRecommendations('prod-source', 5);

    expect(Array.isArray(results)).toBe(true);
    // prod-B xuất hiện ở cả 2 nguồn nên tổng score (0.8*0.6 + 1.0*0.4 = 0.88) cao nhất -> đứng đầu
    expect(results[0]).toBe('prod-B');
    expect(results).toContain('prod-A');
    expect(results).toContain('prod-C');
  });

  test('getBatchRecommendations phải tổng hợp gợi ý từ nhiều sản phẩm nguồn và loại bỏ sản phẩm nguồn', async () => {
    jest.spyOn(service, 'getHybridRecommendations').mockImplementation(async (id) => {
      if (id === 'source-1') return ['rec-1', 'rec-2', 'source-2'];
      if (id === 'source-2') return ['rec-2', 'rec-3', 'rec-4'];
      return [];
    });

    const results = await service.getBatchRecommendations(['source-1', 'source-2'], 4);

    expect(Array.isArray(results)).toBe(true);
    // source-2 không được nằm trong kết quả gợi ý (vì là sp nguồn)
    expect(results).not.toContain('source-2');
    expect(results).not.toContain('source-1');
    expect(results.length).toBeLessThanOrEqual(4);
  });

  test('logInteraction phải gọi prisma.recommendationLog.create với dữ liệu chính xác', async () => {
    await service.logInteraction('source-1', 'rec-1', 'CLICK', 'user-999', 0.85);

    const { PrismaClient } = require('@prisma/client');
    const prismaInstance = new PrismaClient();

    expect(prismaInstance.recommendationLog.create).toHaveBeenCalledWith({
      data: {
        source_product_id: 'source-1',
        recommended_product_id: 'rec-1',
        event_type: 'CLICK',
        customer_id: 'user-999',
        similarity_score: 0.85
      }
    });
  });
});
