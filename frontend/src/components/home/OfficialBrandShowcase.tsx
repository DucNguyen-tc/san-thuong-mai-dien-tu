import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronRight, Star, Truck, RotateCcw, Award, Sparkles, ArrowRight } from 'lucide-react';
import { getProducts } from '@/services/productService';
import type { CatalogProduct } from '@/types/catalog';
import { getPrimaryImageUrl, getDisplayPrice } from '@/types/catalog';
import { formatPrice } from '@/utils/formatters';

interface BrandConfig {
  id: string;
  name: string;
  keyword: string;
  tagline: string;
  gradient: string;
  accentColor: string;
  badgeText: string;
  perks: string[];
}

const BRANDS: BrandConfig[] = [
  {
    id: 'apple',
    name: 'Apple',
    keyword: 'Apple',
    tagline: 'Đỉnh cao công nghệ, thiết kế tối giản & hệ sinh thái vượt bậc',
    gradient: 'from-zinc-900 via-neutral-900 to-zinc-800',
    accentColor: 'text-zinc-100',
    badgeText: 'Apple Authorised Reseller',
    perks: ['Bảo hành 12 tháng Apple Care', 'Hỗ trợ trả góp 0% lãi suất', 'Giao hỏa tốc 2 giờ'],
  },
  {
    id: 'samsung',
    name: 'Samsung',
    keyword: 'Samsung',
    tagline: 'Tiên phong kỷ nguyên Galaxy AI & công nghệ hiển thị tương lai',
    gradient: 'from-blue-950 via-slate-900 to-blue-900',
    accentColor: 'text-blue-300',
    badgeText: 'Samsung Official Flagship',
    perks: ['Đặc quyền bảo hành Samsung Care+', 'Thu cũ đổi mới trợ giá 2 triệu', 'Tặng củ sạc nhanh chính hãng'],
  },
  {
    id: 'sony',
    name: 'Sony',
    keyword: 'Sony',
    tagline: 'Âm thanh Hi-Res chuẩn phòng thu & máy ảnh Alpha huyền thoại',
    gradient: 'from-neutral-900 via-stone-900 to-slate-900',
    accentColor: 'text-orange-300',
    badgeText: 'Sony Premium Partner',
    perks: ['Bảo hành chính hãng Sony VN', 'Miễn phí cân chỉnh ống kính', 'Tặng túi đựng cao cấp'],
  },
  {
    id: 'asus',
    name: 'ASUS',
    keyword: 'ASUS',
    tagline: 'Cỗ máy Gaming ROG & laptop văn phòng Zenbook mỏng nhẹ',
    gradient: 'from-red-950 via-neutral-900 to-rose-950',
    accentColor: 'text-rose-400',
    badgeText: 'ASUS ROG Elite Store',
    perks: ['Bảo hành quốc tế 2 năm', 'Bảo hành rơi vỡ năm đầu', 'Tặng chuột gaming ROG'],
  },
  {
    id: 'dior',
    name: 'Dior',
    keyword: 'Dior',
    tagline: 'Hương thơm kiêu sa, quyến rũ & đẳng cấp Haute Couture Paris',
    gradient: 'from-amber-950 via-stone-900 to-neutral-950',
    accentColor: 'text-amber-300',
    badgeText: 'Christian Dior Parfums',
    perks: ['Nhập khẩu nguyên chai từ Pháp', 'Hộp quà thắt nơ lụa cao cấp', 'Tặng kèm 2 mẫu thử mini'],
  },
  {
    id: 'nike',
    name: 'Nike',
    keyword: 'Nike',
    tagline: 'Just Do It — Bứt phá mọi giới hạn & làm chủ mọi cuộc chơi',
    gradient: 'from-orange-950 via-neutral-900 to-zinc-900',
    accentColor: 'text-orange-400',
    badgeText: 'Nike Official Store',
    perks: ['Đổi trả size miễn phí 30 ngày', 'Công nghệ đệm ZoomX & Air Zoom', 'Tem chống giả phản quang'],
  },
];

export default function OfficialBrandShowcase() {
  const [activeBrand, setActiveBrand] = useState<BrandConfig>(BRANDS[0]);
  const [brandProducts, setBrandProducts] = useState<Record<string, CatalogProduct[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // Cache products for brand
    if (brandProducts[activeBrand.id]) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getProducts({ search: activeBrand.keyword, limit: 12 })
      .then((res) => {
        if (!isMounted) return;
        const items = res.items || [];
        // Lọc bớt trùng tên nếu có và lấy 4 sản phẩm đại diện
        const uniqueItems: CatalogProduct[] = [];
        const seenNames = new Set<string>();

        for (const p of items) {
          const shortName = p.name.slice(0, 25).toLowerCase();
          if (!seenNames.has(shortName)) {
            seenNames.add(shortName);
            uniqueItems.push(p);
          }
          if (uniqueItems.length >= 4) break;
        }

        setBrandProducts((prev) => ({
          ...prev,
          [activeBrand.id]: uniqueItems.length > 0 ? uniqueItems : items.slice(0, 4),
        }));
      })
      .catch((err) => {
        console.warn('Lỗi tải sản phẩm thương hiệu:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeBrand.id, activeBrand.keyword]);

  const currentProducts = brandProducts[activeBrand.id] || [];

  return (
    <section className="mt-14">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 px-3 py-1 rounded-full shadow-xs">
              <ShieldCheck size={14} className="text-blue-600" />
              V-Shop Mall • 100% Chính Hãng
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Gian Hàng Thương Hiệu Chính Hãng
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Sản phẩm phân phối độc quyền, miễn phí đổi trả 30 ngày & bảo hành toàn cầu
          </p>
        </div>

        <Link
          to={`/products?search=${encodeURIComponent(activeBrand.name)}`}
          className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group/link"
        >
          Khám phá tất cả thương hiệu
          <ChevronRight size={16} className="transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>

      {/* Brand Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
        {BRANDS.map((brand) => {
          const isSelected = activeBrand.id === brand.id;
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => setActiveBrand(brand)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                isSelected
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md scale-102'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <Award size={15} className={isSelected ? 'text-yellow-400' : 'text-gray-400'} />
              <span>{brand.name}</span>
            </button>
          );
        })}
      </div>

      {/* Showcase Grid: Left Brand Hero Card + Right 4 Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* BÊN TRÁI: Brand Hero Card */}
        <div
          className={`lg:col-span-4 rounded-3xl p-6 md:p-8 bg-gradient-to-br ${activeBrand.gradient} text-white flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-500`}
        >
          {/* Subtle background glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Mall Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white border border-white/20 mb-4">
              <Sparkles size={12} className="text-yellow-300" />
              {activeBrand.badgeText}
            </div>

            <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              {activeBrand.name}
            </h3>

            <p className="text-sm text-gray-300 leading-relaxed font-medium mb-6">
              {activeBrand.tagline}
            </p>

            {/* Brand Perks */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              {activeBrand.perks.map((perk, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-gray-200 font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-yellow-300">
                    ✓
                  </div>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Link */}
          <div className="pt-8 relative z-10">
            <Link
              to={`/products?search=${encodeURIComponent(activeBrand.keyword)}`}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white text-gray-900 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all shadow-md group/btn"
            >
              <span>Vào gian hàng {activeBrand.name}</span>
              <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* BÊN PHẢI: Lưới 4 sản phẩm chính hãng */}
        <div className="lg:col-span-8">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-4 h-[330px] animate-pulse flex flex-col justify-between"
                >
                  <div className="aspect-square bg-gray-100 rounded-xl mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-5 bg-gray-100 rounded w-1/3 mt-4" />
                </div>
              ))}
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="h-full bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <ShieldCheck size={40} className="text-gray-300 mb-2" />
              <p className="text-sm">Đang cập nhật các mẫu sản phẩm mới nhất của {activeBrand.name}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
              {currentProducts.map((product) => {
                const img = getPrimaryImageUrl(product) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
                const price = getDisplayPrice(product);
                const originalPrice = Math.round((price * 1.15) / 10000) * 10000;

                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group bg-white rounded-2xl border border-gray-200/70 p-3.5 flex flex-col justify-between hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    {/* Mall Verified Badge */}
                    <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                      <ShieldCheck size={11} />
                      Mall
                    </div>

                    {/* Product Image */}
                    <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-3 flex items-center justify-center">
                      <img
                        src={img}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                          {activeBrand.name}
                        </span>
                        <h4 className="font-semibold text-xs md:text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-100 flex flex-col">
                        <div className="flex items-center gap-1 text-[11px] text-yellow-500 mb-1">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-gray-700">4.9</span>
                          <span className="text-gray-400">(90+ đánh giá)</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm md:text-base font-extrabold text-blue-600">
                            {formatPrice(price)}
                          </span>
                          {originalPrice > price && (
                            <span className="text-[10px] text-gray-400 line-through">
                              {formatPrice(originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

