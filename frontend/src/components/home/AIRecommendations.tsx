/**
 * AIRecommendations.tsx
 * Khối "Sản phẩm dành riêng cho bạn" ở trang chủ.
 *
 * Logic hiển thị 3 trường hợp:
 *
 *  [1] GUEST / Không có lịch sử:
 *      → Gọi API /recommendations/popular
 *      → Tiêu đề: "Sản phẩm bán chạy" (không có badge AI)
 *
 *  [2] FOCUSED — Tập trung 1 nhóm (≥70% trong 5 sp gần nhất cùng 1 category):
 *      → Gọi API /recommendations/:id (Hybrid AI) dựa trên sp mới xem nhất
 *      → Tiêu đề: "Dành riêng cho bạn" + badge AI
 *
 *  [3] DIVERSE — Hành vi đa dạng:
 *      → Gọi API /recommendations/batch với top-3 sp gần nhất
 *      → Tiêu đề: "Gợi ý cho bạn" + badge AI
 */
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPopularProductIds, getSimilarProductIds, getBatchRecommendationIds } from '@/services/recommendationService';
import { getProductById } from '@/services/productService';
import { analyzeViewPattern } from '@/services/userBehaviorService';
import type { CatalogProduct } from '@/types/catalog';
import AIProductCard from '@/components/product/AIProductCard';

type SectionMode = 'popular' | 'focused' | 'diverse';

export default function AIRecommendations() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<SectionMode>('popular');
  const [dominantCategory, setDominantCategory] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 400;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);

        // ── Phân tích hành vi người dùng từ localStorage ──
        const analysis = analyzeViewPattern();

        let productIds: string[] = [];
        let resolvedMode: SectionMode = 'popular';

        if (analysis.pattern === 'empty') {
          // ─── Trường hợp 1: Guest / không có lịch sử → Popular ───
          resolvedMode = 'popular';
          productIds = await getPopularProductIds(15);

        } else if (analysis.pattern === 'focused') {
          // ─── Trường hợp 2: Tập trung 1 nhóm → Hybrid từ sp mới nhất ───
          resolvedMode = 'focused';
          const sourceProductId = analysis.topProductIds[0];
          productIds = await getSimilarProductIds(sourceProductId, 15);

          // Fallback về popular nếu không có kết quả
          if (productIds.length === 0) {
            resolvedMode = 'popular';
            productIds = await getPopularProductIds(15);
          }

        } else {
          // ─── Trường hợp 3: Đa dạng → Batch từ top-3 sp gần nhất ───
          resolvedMode = 'diverse';
          const topIds = analysis.topProductIds.slice(0, 3);
          productIds = await getBatchRecommendationIds(topIds, 15);

          // Fallback về popular nếu không có kết quả
          if (productIds.length === 0) {
            resolvedMode = 'popular';
            productIds = await getPopularProductIds(15);
          }
        }

        if (isCancelled) return;

        setMode(resolvedMode);
        if (analysis.dominantCategoryName) {
          setDominantCategory(analysis.dominantCategoryName);
        }

        // ── Lấy chi tiết sản phẩm từ catalog ──
        if (productIds.length === 0) {
          setProducts([]);
          return;
        }

        const promises = productIds.map((id) => getProductById(id).catch(() => null));
        const results = await Promise.all(promises);
        const validProducts = results.filter((p): p is CatalogProduct => p !== null);

        if (!isCancelled) setProducts(validProducts);

      } catch (error) {
        console.error('[AIRecommendations] Failed:', error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchRecommendations();
    return () => { isCancelled = true; };
  }, []);

  // ── Tiêu đề và icon thay đổi theo mode ──
  const sectionConfig = {
    popular: {
      title: 'Sản phẩm bán chạy',
      subtitle: 'Được mua nhiều nhất trong tuần',
      icon: <TrendingUp size={16} className="text-orange-500" />,
      badge: null,
    },
    focused: {
      title: 'Dành riêng cho bạn',
      subtitle: dominantCategory ? `Dựa trên sở thích về ${dominantCategory}` : 'Dựa trên lịch sử của bạn',
      icon: <Sparkles size={16} className="fill-primary text-primary" />,
      badge: (
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles size={10} className="fill-primary" />
          AI Gợi Ý
        </span>
      ),
    },
    diverse: {
      title: 'Gợi ý cho bạn',
      subtitle: 'Dựa trên những gì bạn đã xem gần đây',
      icon: <Sparkles size={16} className="fill-primary text-primary" />,
      badge: (
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles size={10} className="fill-primary" />
          AI Gợi Ý
        </span>
      ),
    },
  };

  const config = sectionConfig[mode];

  return (
    <section className="mt-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {config.icon}
            <h2 className="text-xl font-bold text-on-surface">{config.title}</h2>
            {config.badge}
          </div>
          {!isLoading && products.length > 0 && (
            <p className="text-sm text-on-surface-variant pl-6">{config.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 -mx-2 px-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[380px] h-[160px] bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex gap-4 animate-pulse"
            >
              <div className="w-32 h-32 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1 py-2 flex flex-col gap-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3 mt-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Horizontal Scroll Container */}
      {!isLoading && products.length > 0 && (
        <div ref={containerRef} className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 -mx-2 px-2">
          {products.map((product) => (
            <Link to={`/products/${product.id}`} key={product.id}>
              <AIProductCard product={product} />
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center py-10 text-on-surface-variant gap-2">
          <Sparkles size={32} className="opacity-30" />
          <p className="text-sm">Chưa có sản phẩm để gợi ý</p>
        </div>
      )}
    </section>
  );
}
