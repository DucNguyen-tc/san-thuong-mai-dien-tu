import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  X,
  Filter,
  Check,
  RotateCcw,
  Tag,
  Palette,
  Layers,
} from 'lucide-react';
import { searchProducts } from '@/services/searchService';
import type { SearchFacets } from '@/services/searchService';
import { formatPrice } from '@/utils/formatters';
import StarRating from '@/components/ui/StarRating';

interface DisplayProduct {
  id: string;
  name: string;
  image_url: string;
  price: number;
  original_price?: number;
  discount_percent?: number;
  rating?: number;
  reviews_count?: number;
  highlight?: {
    name?: string[];
    description?: string[];
  };
}

function getDeterministicMockRating(productId: string) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  const rating = 4.0 + (absHash % 11) / 10;
  const reviewsCount = 10 + (absHash % 111);
  return { rating, reviewsCount };
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc state từ URL Search Params
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') || '';
  const hasDiscount = searchParams.get('has_discount') === 'true';
  const sortBy = searchParams.get('sort') || 'relevance';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) ? 1 : pageParam;

  const priceMinParam = searchParams.get('price_min');
  const priceMaxParam = searchParams.get('price_max');
  const colorParam = searchParams.get('color') || '';
  const brandParam = searchParams.get('brand') || '';

  // Local state
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Custom price input state
  const [customPriceMin, setCustomPriceMin] = useState(priceMinParam || '');
  const [customPriceMax, setCustomPriceMax] = useState(priceMaxParam || '');

  // Đồng bộ khi URL thay đổi
  useEffect(() => {
    setCustomPriceMin(priceMinParam || '');
    setCustomPriceMax(priceMaxParam || '');
  }, [priceMinParam, priceMaxParam]);

  // Phân tích mảng màu sắc và thương hiệu đã chọn
  const selectedColors = colorParam ? colorParam.split(',').map((c) => c.trim()).filter(Boolean) : [];
  const selectedBrands = brandParam ? brandParam.split(',').map((b) => b.trim()).filter(Boolean) : [];

  // Toggle Checkbox cho Multi-select (Màu sắc, Thương hiệu)
  const toggleFacetItem = (paramKey: 'color' | 'brand', value: string) => {
    const currentList = paramKey === 'color' ? [...selectedColors] : [...selectedBrands];
    const index = currentList.indexOf(value);

    if (index > -1) {
      currentList.splice(index, 1);
    } else {
      currentList.push(value);
    }

    if (currentList.length > 0) {
      searchParams.set(paramKey, currentList.join(','));
    } else {
      searchParams.delete(paramKey);
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  // Chọn khoảng giá nhanh
  const handleSelectPriceRange = (from?: number, to?: number) => {
    if (from !== undefined) searchParams.set('price_min', from.toString());
    else searchParams.delete('price_min');

    if (to !== undefined) searchParams.set('price_max', to.toString());
    else searchParams.delete('price_max');

    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  // Áp dụng khoảng giá tùy chỉnh
  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPriceMin) searchParams.set('price_min', customPriceMin);
    else searchParams.delete('price_min');

    if (customPriceMax) searchParams.set('price_max', customPriceMax);
    else searchParams.delete('price_max');

    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  // Reset toàn bộ bộ lọc
  const handleResetFilters = () => {
    const nextParams = new URLSearchParams();
    if (search) nextParams.set('search', search);
    setSearchParams(nextParams);
  };

  // Xóa 1 điều kiện lọc cụ thể
  const removeFilter = (key: string, value?: string) => {
    if (key === 'color' && value) {
      const updated = selectedColors.filter((c) => c !== value);
      if (updated.length > 0) searchParams.set('color', updated.join(','));
      else searchParams.delete('color');
    } else if (key === 'brand' && value) {
      const updated = selectedBrands.filter((b) => b !== value);
      if (updated.length > 0) searchParams.set('brand', updated.join(','));
      else searchParams.delete('brand');
    } else if (key === 'price') {
      searchParams.delete('price_min');
      searchParams.delete('price_max');
    } else if (key === 'category') {
      searchParams.delete('category_id');
    } else if (key === 'discount') {
      searchParams.delete('has_discount');
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  // Gọi Search API (Hợp nhất theo thiết kế Giai đoạn 2)
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    searchProducts({
      q: search.trim() || undefined,
      page,
      limit: 12,
      category_id: categoryId || undefined,
      price_min: priceMinParam ? Number(priceMinParam) : undefined,
      price_max: priceMaxParam ? Number(priceMaxParam) : undefined,
      color: colorParam || undefined,
      brand: brandParam || undefined,
      has_discount: hasDiscount || undefined,
      sort: sortBy === 'popular' ? 'relevance' : sortBy,
    })
      .then((result) => {
        if (!isCancelled) {
          const mapped: DisplayProduct[] = (result.items || []).map((item) => ({
            id: item.id,
            name: item.name,
            image_url: item.image_url,
            price: item.price,
            original_price: item.original_price,
            discount_percent: item.discount_percent,
            highlight: item.highlight,
          }));
          setProducts(mapped);
          setFacets(result.facets);
          setTotalPages(result.pagination?.totalPages || 1);
          setTotalItems(result.pagination?.total || 0);
        }
      })
      .catch((err) => {
        console.error('[Faceted Search Error]:', err);
        if (!isCancelled) {
          setProducts([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [search, categoryId, priceMinParam, priceMaxParam, colorParam, brandParam, hasDiscount, sortBy, page]);

  // Kiểm tra có đang áp dụng bất kỳ bộ lọc nào không
  const hasActiveFilters = Boolean(
    categoryId ||
    priceMinParam ||
    priceMaxParam ||
    selectedColors.length > 0 ||
    selectedBrands.length > 0 ||
    hasDiscount
  );

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 mt-6 flex gap-6">

        {/* SIDEBAR BỘ LỌC (FACETED SIDEBAR) */}
        <div className="w-[280px] flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-6 shadow-sm space-y-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
            
            {/* Header Sidebar */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                <Filter size={18} className="text-primary" />
                Bộ lọc tìm kiếm
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-primary hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} />
                  Đặt lại
                </button>
              )}
            </div>

            {/* 1. Facet: Danh mục */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <Layers size={14} />
                Danh mục
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    searchParams.delete('category_id');
                    searchParams.set('page', '1');
                    setSearchParams(searchParams);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    !categoryId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>Tất cả danh mục</span>
                  <span className="text-xs text-gray-400">({facets?.categories.reduce((s, c) => s + c.count, 0) || totalItems})</span>
                </button>

                {facets?.categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      searchParams.set('category_id', cat.id);
                      searchParams.set('page', '1');
                      setSearchParams(searchParams);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      categoryId === cat.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">({cat.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Facet: Khoảng giá */}
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Khoảng giá
              </h3>

              {/* Các khoảng giá nhanh */}
              <div className="space-y-1 mb-3">
                {facets?.price_ranges.map((range, idx) => {
                  const isSelected =
                    (range.from === undefined || Number(priceMinParam) === range.from) &&
                    (range.to === undefined || Number(priceMaxParam) === range.to) &&
                    Boolean(priceMinParam || priceMaxParam);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPriceRange(range.from, range.to)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span>{range.key}</span>
                      <span className="text-gray-400 font-normal">({range.count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Nhập khoảng giá tùy chỉnh */}
              <form onSubmit={handleApplyCustomPrice} className="space-y-2 pt-1">
                <p className="text-[11px] text-gray-400">Hoặc tự nhập khoảng giá (₫):</p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Từ"
                    value={customPriceMin}
                    onChange={(e) => setCustomPriceMin(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    value={customPriceMax}
                    onChange={(e) => setCustomPriceMax(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-xs font-semibold py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Áp dụng
                </button>
              </form>
            </div>

            {/* 3. Facet: Thương hiệu (Brands) */}
            {facets && facets.brands.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <Tag size={14} />
                  Thương hiệu
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {facets.brands.map((b) => {
                    const checked = selectedBrands.includes(b.key);
                    return (
                      <label
                        key={b.key}
                        onClick={() => toggleFacetItem('brand', b.key)}
                        className="flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              checked ? 'bg-primary border-primary text-white' : 'border-gray-300 group-hover:border-gray-400'
                            }`}
                          >
                            {checked && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className={checked ? 'font-medium text-primary' : ''}>{b.key}</span>
                        </div>
                        <span className="text-xs text-gray-400">({b.count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Facet: Màu sắc (Colors) */}
            {facets && facets.colors.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                  <Palette size={14} />
                  Màu sắc
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {facets.colors.map((c) => {
                    const checked = selectedColors.includes(c.key);
                    return (
                      <label
                        key={c.key}
                        onClick={() => toggleFacetItem('color', c.key)}
                        className="flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              checked ? 'bg-primary border-primary text-white' : 'border-gray-300 group-hover:border-gray-400'
                            }`}
                          >
                            {checked && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className={checked ? 'font-medium text-primary' : ''}>{c.key}</span>
                        </div>
                        <span className="text-xs text-gray-400">({c.count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Facet: Khuyến mãi */}
            <div className="pt-2 border-t border-gray-100">
              <label
                onClick={() => {
                  if (hasDiscount) searchParams.delete('has_discount');
                  else searchParams.set('has_discount', 'true');
                  searchParams.set('page', '1');
                  setSearchParams(searchParams);
                }}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      hasDiscount ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 group-hover:border-gray-400'
                    }`}
                  >
                    {hasDiscount && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Đang giảm giá</span>
                </div>
                {facets && <span className="text-xs text-gray-400">({facets.discount_count})</span>}
              </label>
            </div>

          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1">

          {/* ACTIVE FILTER CHIPS */}
          {hasActiveFilters && (
            <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4 shadow-sm flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
                Đang lọc theo:
              </span>

              {/* Chip: Danh mục */}
              {categoryId && facets && (
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">
                  <span>DM: {facets.categories.find((c) => c.id === categoryId)?.name || 'Đã chọn'}</span>
                  <button type="button" onClick={() => removeFilter('category')} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}

              {/* Chip: Giá */}
              {(priceMinParam || priceMaxParam) && (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-100">
                  <span>
                    Giá: {priceMinParam ? formatPrice(Number(priceMinParam)) : '0'} -{' '}
                    {priceMaxParam ? formatPrice(Number(priceMaxParam)) : '∞'}
                  </span>
                  <button type="button" onClick={() => removeFilter('price')} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}

              {/* Chips: Thương hiệu */}
              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium border border-purple-100"
                >
                  <span>Hãng: {b}</span>
                  <button type="button" onClick={() => removeFilter('brand', b)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ))}

              {/* Chips: Màu sắc */}
              {selectedColors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100"
                >
                  <span>Màu: {c}</span>
                  <button type="button" onClick={() => removeFilter('color', c)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ))}

              {/* Chip: Giảm giá */}
              {hasDiscount && (
                <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium border border-red-100">
                  <span>Đang giảm giá</span>
                  <button type="button" onClick={() => removeFilter('discount')} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}

              {/* Nút xóa tất cả */}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-red-500 hover:underline font-medium ml-auto"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* ACTIVE SEARCH BANNER */}
          {search && (
            <div className="mb-4 flex items-center justify-between bg-blue-50/70 border border-blue-100 px-4 py-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Kết quả tìm kiếm cho:</span>
                <span className="text-sm font-semibold text-blue-700">"{search}"</span>
                <span className="text-xs text-gray-400">({totalItems} sản phẩm)</span>
              </div>
              <button
                onClick={() => {
                  searchParams.delete('search');
                  setSearchParams(searchParams);
                }}
                className="text-gray-400 hover:text-red-500 p-1 flex items-center gap-1 text-xs"
                title="Xóa tìm kiếm"
              >
                <span>Xóa từ khóa</span>
                <X size={14} />
              </button>
            </div>
          )}

          {/* THANH SẮP XẾP */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 mb-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sắp xếp theo:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    searchParams.set('sort', 'relevance');
                    setSearchParams(searchParams);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    sortBy === 'relevance' || sortBy === 'popular'
                      ? 'bg-[#0052cc] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Liên quan nhất
                </button>
                <button
                  onClick={() => {
                    searchParams.set('sort', 'newest');
                    setSearchParams(searchParams);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    sortBy === 'newest'
                      ? 'bg-[#0052cc] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Mới nhất
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="flex items-center gap-2 cursor-pointer border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300">
                <span className="text-sm text-gray-700">
                  {sortBy === 'price_asc'
                    ? 'Giá: Thấp đến Cao'
                    : sortBy === 'price_desc'
                    ? 'Giá: Cao đến Thấp'
                    : 'Giá'}
                </span>
                <ChevronDown size={16} className="text-gray-500" />
              </div>
              <div className="absolute right-0 top-full pt-1 w-48 hidden group-hover:block z-10">
                <div className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      searchParams.set('sort', 'price_asc');
                      setSearchParams(searchParams);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  >
                    Giá: Thấp đến Cao
                  </button>
                  <button
                    onClick={() => {
                      searchParams.set('sort', 'price_desc');
                      setSearchParams(searchParams);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  >
                    Giá: Cao đến Thấp
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GRID SẢN PHẨM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 h-[380px] animate-pulse"
                ></div>
              ))
            ) : products.length > 0 ? (
              products.map((product) => (
                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col"
                >
                  {/* Image area */}
                  <div className="relative aspect-square bg-gray-50 overflow-hidden p-4">
                    <img
                      src={product.image_url || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Discount Badge */}
                    {Boolean(product.discount_percent && product.discount_percent > 0) && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        -{product.discount_percent}%
                      </div>
                    )}
                  </div>

                  {/* Info area */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {product.highlight?.name?.[0] ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: product.highlight.name[0],
                          }}
                        />
                      ) : (
                        product.name
                      )}
                    </h3>

                    <div className="mb-2">
                      <StarRating
                        rating={
                          product.rating ||
                          getDeterministicMockRating(product.id).rating
                        }
                        count={
                          product.reviews_count ||
                          getDeterministicMockRating(product.id).reviewsCount
                        }
                      />
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-end gap-2">
                        <span className="text-[#0052cc] font-bold">
                          {formatPrice(product.price)}
                        </span>
                        {product.original_price &&
                          product.original_price > product.price && (
                            <span className="text-gray-400 text-xs line-through">
                              {formatPrice(product.original_price)}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              /* ZERO-RESULT UI THÂN THIỆN */
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Không tìm thấy sản phẩm nào
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
                  Không có sản phẩm nào khớp với tất cả các tiêu chí lọc hiện tại của bạn. Hãy thử bỏ bớt một vài bộ lọc hoặc tìm với từ khóa khác.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    Đặt lại tất cả bộ lọc
                  </button>
                )}
              </div>
            )}
          </div>

          {/* PHÂN TRANG (PAGINATION) */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  searchParams.set('page', (page - 1).toString());
                  setSearchParams(searchParams);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= page - 1 && p <= page + 1)
                ) {
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        searchParams.set('page', p.toString());
                        setSearchParams(searchParams);
                      }}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg ${
                        page === p
                          ? 'bg-[#0052cc] text-white font-medium'
                          : 'border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }

                if (p === page - 2 || p === page + 2) {
                  return (
                    <span key={p} className="text-gray-400">
                      ...
                    </span>
                  );
                }

                return null;
              })}

              <button
                disabled={page >= totalPages}
                onClick={() => {
                  searchParams.set('page', (page + 1).toString());
                  setSearchParams(searchParams);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
