import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Flame, ChevronRight, Clock, ChevronLeft } from 'lucide-react';
import { getProducts } from '@/services/productService';
import { getActivePromotions } from '@/services/promotionService';
import { getCategoryTree } from '@/services/categoryService';
import type { CatalogProduct, Category } from '@/types/catalog';
import { getPrimaryImageUrl } from '@/types/catalog';
import { formatPrice } from '@/utils/formatters';

interface FlashSaleItem {
  id: string;
  name: string;
  slug?: string;
  imageUrl: string;
  salePrice: number;
  originalPrice: number;
  discountPercent: number;
  soldCount: number;
  totalStock: number;
}

interface ActivePromoInfo {
  id: string;
  code: string;
  name: string;
  discountValue: number;
  validTo: string;
  categoryName?: string;
}

const PROMO_CATEGORY_MAP: Record<string, string> = {
  'TECH-FLASH-SALE': 'dien-tu',
  'FASHION-FLASH-SALE': 'thoi-trang',
  'BEAUTY-FLASH-SALE': 'suc-khoe-lam-dep',
  'HOME-FLASH-SALE': 'nha-cua-doi-song',
};

export default function FlashSaleSection() {
  const [items, setItems] = useState<FlashSaleItem[]>([]);
  const [activePromo, setActivePromo] = useState<ActivePromoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 450;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // 1. Tải khuyến mãi & Random 1 chương trình + 10 sản phẩm
  useEffect(() => {
    let isMounted = true;

    async function loadFlashSaleData() {
      try {
        setIsLoading(true);

        // Lấy các khuyến mãi đang còn hạn
        const [promos, categories] = await Promise.all([
          getActivePromotions().catch(() => []),
          getCategoryTree().catch(() => [] as Category[]),
        ]);

        if (!isMounted) return;

        // Nếu không có khuyến mãi nào thì fallback
        if (!promos || promos.length === 0) {
          setIsLoading(false);
          return;
        }

        // Random 1 chương trình khuyến mãi
        const selectedPromo = promos[Math.floor(Math.random() * promos.length)];
        const discountVal = Number(selectedPromo.discount_value) || 20;

        // Tìm category ID tương ứng nếu có map
        const targetSlug = PROMO_CATEGORY_MAP[selectedPromo.code];
        const matchedCategory = categories.find((c) => c.slug === targetSlug);

        setActivePromo({
          id: selectedPromo.id,
          code: selectedPromo.code,
          name: selectedPromo.name,
          discountValue: discountVal,
          validTo: selectedPromo.valid_to,
          categoryName: matchedCategory?.name,
        });

        // Lấy sản phẩm thuộc category đó (hoặc sản phẩm có discount)
        const productRes = await getProducts({
          category_id: matchedCategory?.id,
          has_discount: true,
          limit: 24,
        });

        if (!isMounted) return;

        let productList = productRes.items || [];

        // Nếu danh mục không đủ sản phẩm thì fallback lấy các sản phẩm có discount bất kỳ
        if (productList.length < 4) {
          const fallbackRes = await getProducts({ has_discount: true, limit: 20 });
          productList = fallbackRes.items || [];
        }

        // Shuffle ngẫu nhiên danh sách sản phẩm và lấy 10 - 12 sản phẩm
        const shuffled = [...productList].sort(() => 0.5 - Math.random());
        const selectedProducts = shuffled.slice(0, 10);

        const mapped: FlashSaleItem[] = selectedProducts.map((p: CatalogProduct, index: number) => {
          const variant = p.variants?.[0];
          const basePrice = variant ? Number(variant.price) : 500000;
          const discount = discountVal;
          const discountedPrice = Math.round((basePrice * (1 - discount / 100)) / 1000) * 1000;
          const primaryImg = getPrimaryImageUrl(p) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

          // Giả lập số lượng đã bán dựa trên id hoặc index để thanh tiến trình sinh động
          const soldCount = 10 + ((p.name.length * 3 + index * 7) % 35);
          const totalStock = soldCount + 5 + ((index * 3) % 15);

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            imageUrl: primaryImg,
            salePrice: discountedPrice,
            originalPrice: basePrice,
            discountPercent: discount,
            soldCount,
            totalStock,
          };
        });

        setItems(mapped);
      } catch (err) {
        console.error('Failed to load flash sale products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFlashSaleData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Đồng hồ đếm ngược tính toán thời gian thật đến `validTo` của promotion
  useEffect(() => {
    if (!activePromo?.validTo) return;

    const calculateRemaining = () => {
      const diff = new Date(activePromo.validTo).getTime() - Date.now();
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 };
      }
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return { hours, minutes, seconds };
    };

    // Set ban đầu
    setTimeLeft(calculateRemaining());

    const timer = setInterval(() => {
      const nextTime = calculateRemaining();
      setTimeLeft(nextTime);

      // Nếu hết thời gian thì reload để lấy đợt sale mới
      if (nextTime.hours === 0 && nextTime.minutes === 0 && nextTime.seconds === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activePromo?.validTo]);

  const formatDigits = (num: number) => num.toString().padStart(2, '0');

  // Nếu không có sản phẩm nào sau khi tải xong thì không hiển thị
  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Title + Countdown + Navigation Arrows */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-bounce">
            <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                Flash Sale
              </h2>
              {activePromo && (
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-yellow-400 text-red-900 px-2.5 py-0.5 rounded-full shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-red-900" /> Giảm {activePromo.discountValue}%
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-red-100 mt-0.5 font-medium flex items-center gap-1.5">
              <span>{activePromo?.name || 'Cơ hội săn deal hời duy nhất hôm nay'}</span>
              {activePromo?.categoryName && (
                <span className="bg-white/20 px-2 py-0.2 rounded-md text-[11px]">
                  {activePromo.categoryName}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Header controls: Countdown Timer + Navigation Buttons + View All */}
        <div className="flex items-center gap-3 ml-auto md:ml-0 flex-wrap">
          {/* Countdown Timer */}
          <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15">
            <Clock className="w-4 h-4 text-yellow-300" />
            <span className="text-xs uppercase font-bold text-red-100 hidden sm:inline">
              Kết thúc sau:
            </span>
            <div className="flex items-center gap-1 font-mono font-bold text-sm md:text-base">
              <span className="bg-white text-gray-900 px-2 py-0.5 rounded-lg shadow-xs">
                {formatDigits(timeLeft.hours)}
              </span>
              <span className="text-yellow-300">:</span>
              <span className="bg-white text-gray-900 px-2 py-0.5 rounded-lg shadow-xs">
                {formatDigits(timeLeft.minutes)}
              </span>
              <span className="text-yellow-300">:</span>
              <span className="bg-white text-gray-900 px-2 py-0.5 rounded-lg shadow-xs">
                {formatDigits(timeLeft.seconds)}
              </span>
            </div>
          </div>

          {/* Carousel Scroll Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Xem sản phẩm trước"
              aria-label="Previous slide"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Xem sản phẩm tiếp theo"
              aria-label="Next slide"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <Link
            to="/products?has_discount=true"
            className="text-xs md:text-sm font-bold text-white/90 hover:text-white flex items-center gap-0.5 group/btn ml-1"
          >
            Tất cả deal
            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="flex gap-4 md:gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[220px] md:min-w-[260px] h-80 bg-white/10 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        /* Carousel horizontal scroll view */
        <div
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-5 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory relative z-10 pb-2 -mx-2 px-2"
        >
          {items.map((item) => {
            const soldPercentage = Math.min(100, Math.round((item.soldCount / item.totalStock) * 100));

            return (
              <Link
                key={item.id}
                to={`/products/${item.id}`}
                className="group bg-white rounded-2xl overflow-hidden p-3 md:p-3.5 flex flex-col justify-between text-gray-900 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative min-w-[220px] max-w-[230px] md:min-w-[260px] md:max-w-[270px] shrink-0 snap-start"
              >
                {/* Discount Tag */}
                <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-[11px] px-2 py-1 rounded-lg shadow-md flex items-center gap-0.5">
                  <Flame className="w-3 h-3 fill-white" />
                  -{item.discountPercent}%
                </div>

                {/* Product Image */}
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-3 flex items-center justify-center">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-xs md:text-sm text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {item.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm md:text-base font-extrabold text-red-600">
                        {formatPrice(item.salePrice)}
                      </span>
                      <span className="text-[11px] text-gray-400 line-through">
                        {formatPrice(item.originalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar: Sold count */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1">
                      <span className="flex items-center gap-1 text-red-600">
                        <Flame className="w-3 h-3 fill-red-600" />
                        Đã bán {item.soldCount}
                      </span>
                      <span>Còn {item.totalStock - item.soldCount} suất</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 rounded-full transition-all duration-500"
                        style={{ width: `${soldPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
