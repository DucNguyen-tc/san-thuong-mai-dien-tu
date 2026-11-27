import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Sparkles, Star, Tag, ChevronRight, ShoppingCart } from 'lucide-react';
import { getProducts } from '@/services/productService';
import type { CatalogProduct } from '@/types/catalog';
import { getPrimaryImageUrl, getDisplayPrice, getDiscountedPrice, getMaxDiscountTag } from '@/types/catalog';
import { formatPrice } from '@/utils/formatters';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';

type TabKey = 'best_seller' | 'newest' | 'top_rated' | 'hot_deal';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const TABS: TabConfig[] = [
  { key: 'best_seller', label: 'Bán chạy nhất', icon: Flame, badge: 'Hot' },
  { key: 'newest', label: 'Mới lên kệ', icon: Sparkles, badge: 'New' },
  { key: 'top_rated', label: 'Đánh giá 5 sao', icon: Star },
  { key: 'hot_deal', label: 'Giảm giá sâu', icon: Tag, badge: '-30%' },
];

export default function TrendingProductsTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('best_seller');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    let sortParam: string | undefined = undefined;
    if (activeTab === 'newest') sortParam = 'created_at_desc';
    if (activeTab === 'hot_deal') sortParam = 'price_asc';

    getProducts({ limit: 10, sort: sortParam })
      .then((res) => {
        if (!isMounted) return;
        setProducts(res.items || []);
      })
      .catch((err) => {
        console.warn('Lỗi tải sản phẩm xu hướng:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleQuickAdd = async (e: React.MouseEvent, product: CatalogProduct) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const activeVariant =
        product.variants?.find((v) => v.is_active && v.stock_quantity > 0) ||
        product.variants?.[0];

      await addItem(product.id, activeVariant?.id || '', 1, {
        name: product.name,
        price: getDiscountedPrice(product),
        attributes: {},
        image_url: getPrimaryImageUrl(product) || 'https://via.placeholder.com/300',
      });
      toast.success(`Đã thêm "${product.name.slice(0, 30)}..." vào giỏ!`);
    } catch {
      toast.error('Chưa thể thêm sản phẩm vào giỏ!');
    }
  };

  return (
    <section className="mt-14">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Được yêu thích nhất
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Xu Hướng Mua Sắm & Bán Chạy
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Top những sản phẩm công nghệ, đời sống nhận được nhiều phản hồi tích cực nhất
          </p>
        </div>

        {/* Tab Buttons Pill */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border border-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-300' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col gap-3 animate-pulse"
            >
              <div className="aspect-square bg-gray-100 rounded-xl" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
          Chưa có sản phẩm nào trong mục này.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {products.map((product) => {
            const price = getDiscountedPrice(product);
            const discountTag = getMaxDiscountTag(product);
            const basePrice = getDisplayPrice(product);
            const originalPrice = basePrice > price ? basePrice : null;

            return (
              <Link
                key={product.id}
                to={`/products/${product.slug || product.id}`}
                className="group bg-white rounded-2xl border border-gray-100/80 hover:border-blue-200 p-3 md:p-3.5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
              >
                {/* Discount Tag */}
                {discountTag && (
                  <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                    {discountTag}
                  </div>
                )}

                {/* Product Image */}
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-3 flex items-center justify-center relative">
                  <img
                    src={getPrimaryImageUrl(product) || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Quick Add To Cart Button */}
                  <button
                    onClick={(e) => handleQuickAdd(e, product)}
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 cursor-pointer"
                    title="Thêm vào giỏ"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      {product.category?.name || 'Sản phẩm'}
                    </span>
                    <h3 className="font-semibold text-xs md:text-sm text-gray-900 line-clamp-2 mt-0.5 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-baseline justify-between gap-1 flex-wrap">
                    <span className="text-sm md:text-base font-extrabold text-blue-600">
                      {formatPrice(price)}
                    </span>
                    {originalPrice && originalPrice > price && (
                      <span className="text-[11px] text-gray-400 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* View All Button */}
      <div className="mt-10 flex justify-center">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gray-300 hover:border-blue-600 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-bold text-sm shadow-xs transition-all duration-200 group"
        >
          <span>Khám phá toàn bộ {products.length > 0 ? '+100' : ''} sản phẩm trên sàn</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

