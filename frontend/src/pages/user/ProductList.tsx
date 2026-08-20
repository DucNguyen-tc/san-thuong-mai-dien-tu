import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Star, Filter, Heart, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts } from '@/services/productService';
import { getCategoryTree } from '@/services/categoryService';
import type { CatalogProduct, Category } from '@/types/catalog';
import { getDisplayPrice, getDiscountedPrice, getMaxDiscountTag, getPrimaryImageUrl } from '@/types/catalog';
import { formatPrice } from '@/utils/formatters';
import StarRating from '@/components/ui/StarRating';

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
  const searchParamsRef = searchParams;
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') || '';
  const hasDiscount = searchParams.get('has_discount') === 'true';
  const sortBy = searchParams.get('sort') || 'popular';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const page = isNaN(pageParam) ? 1 : pageParam;

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Lấy danh mục
    getCategoryTree()
      .then(res => setCategories(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    getProducts({ 
      page: page, 
      limit: 12, 
      search: search || undefined, 
      category_id: categoryId || undefined,
      has_discount: hasDiscount || undefined,
      sort: sortBy !== 'popular' ? sortBy : undefined
    })
      .then((result: any) => {
        if (!isCancelled) {
          setProducts(result.items);
          if (result.pagination && result.pagination.totalPages) {
            setTotalPages(result.pagination.totalPages);
          } else {
            setTotalPages(1);
          }
        }
      })
      .catch(() => {
        // Silent error for UI demo
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [search, categoryId, hasDiscount, sortBy, page]);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-16">

      <div className="max-w-7xl mx-auto px-4 mt-6 flex gap-6">
        {/* Sidebar Bộ lọc */}
        <div className="w-[260px] flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Bộ lọc
            </h2>
            
            {/* Danh mục */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Danh mục</h3>
              <div className="space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="category"
                    checked={!categoryId}
                    onChange={() => {
                      searchParams.delete('category_id');
                      searchParams.delete('search');
                      setSearchParams(searchParams);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className={`text-sm ${!categoryId ? 'text-blue-600 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>Tất cả</span>
                </label>
                {categories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="category"
                        checked={categoryId === cat.id}
                        onChange={() => {
                          searchParams.set('category_id', cat.id);
                          searchParams.delete('search');
                          setSearchParams(searchParams);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={`text-sm ${categoryId === cat.id ? 'text-blue-600 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>{cat.name}</span>
                    </label>
                    {cat.children && cat.children.length > 0 && (
                      <div className="pl-6 space-y-2">
                        {cat.children.map(child => (
                          <label key={child.id} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="category"
                              checked={categoryId === child.id}
                              onChange={() => {
                                searchParams.set('category_id', child.id);
                                searchParams.delete('search');
                                setSearchParams(searchParams);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`text-sm ${categoryId === child.id ? 'text-blue-600 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>{child.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Khuyến mãi */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Khuyến mãi</h3>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={hasDiscount}
                  onChange={(e) => {
                    if (e.target.checked) searchParams.set('has_discount', 'true');
                    else searchParams.delete('has_discount');
                    setSearchParams(searchParams);
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900">Sản phẩm đang giảm giá</span>
              </label>
            </div>


          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Active Search Badge */}
          {search && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Kết quả tìm kiếm cho:</span>
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                <span>{search}</span>
                <button 
                  onClick={() => {
                    searchParams.delete('search');
                    setSearchParams(searchParams);
                  }}
                  className="hover:bg-blue-200 text-blue-600 rounded-full p-0.5 transition-colors flex items-center justify-center"
                  aria-label="Xóa tìm kiếm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* Thanh sắp xếp */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 mb-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sắp xếp theo:</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { searchParams.set('sort', 'popular'); setSearchParams(searchParams); }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${sortBy === 'popular' ? 'bg-[#0052cc] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >Phổ biến</button>
                <button 
                  onClick={() => { searchParams.set('sort', 'newest'); setSearchParams(searchParams); }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${sortBy === 'newest' ? 'bg-[#0052cc] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >Mới nhất</button>
                <button 
                  onClick={() => { searchParams.set('sort', 'sales'); setSearchParams(searchParams); }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${sortBy === 'sales' ? 'bg-[#0052cc] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >Bán chạy</button>
              </div>
            </div>
            <div className="relative group">
              <div className="flex items-center gap-2 cursor-pointer border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300">
                <span className="text-sm text-gray-700">
                  {sortBy === 'price_asc' ? 'Giá: Thấp đến Cao' : sortBy === 'price_desc' ? 'Giá: Cao đến Thấp' : 'Giá'}
                </span>
                <ChevronDown size={16} className="text-gray-500" />
              </div>
              <div className="absolute right-0 top-full pt-1 w-48 hidden group-hover:block z-10">
                <div className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
                  <button 
                    onClick={() => { searchParams.set('sort', 'price_asc'); setSearchParams(searchParams); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  >Giá: Thấp đến Cao</button>
                  <button 
                    onClick={() => { searchParams.set('sort', 'price_desc'); setSearchParams(searchParams); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  >Giá: Cao đến Thấp</button>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Sản phẩm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-[380px] animate-pulse"></div>
              ))
            ) : products.length > 0 ? (
              products.map((product, i) => (
                <Link to={`/products/${product.id}`} key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col">
                  {/* Image area */}
                  <div className="relative aspect-square bg-gray-50 overflow-hidden p-4">
                    <img 
                      src={getPrimaryImageUrl(product) || 'https://via.placeholder.com/300?text=No+Image'} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Discount Badge */}
                    {getMaxDiscountTag(product) && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        {getMaxDiscountTag(product)}
                      </div>
                    )}


                  </div>

                  {/* Info area */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="mb-2">
                      <StarRating 
                        rating={product.rating || getDeterministicMockRating(product.id).rating} 
                        count={product.reviews_count || getDeterministicMockRating(product.id).reviewsCount} 
                      />
                    </div>
                    
                    <div className="mt-auto">
                      <div className="flex items-end gap-2">
                        <span className="text-[#0052cc] font-bold">{formatPrice(getDiscountedPrice(product))}</span>
                        {getDiscountedPrice(product) < getDisplayPrice(product) && (
                          <span className="text-gray-400 text-xs line-through">{formatPrice(getDisplayPrice(product))}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                Không tìm thấy sản phẩm nào.
              </div>
            )}
            
            {/* Grid Sản phẩm đã render xong, không cần mock data nữa */}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
               <button 
                 disabled={page <= 1}
                 onClick={() => { searchParams.set('page', (page - 1).toString()); setSearchParams(searchParams); }}
                 className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
               >
                 <ChevronRight size={18} className="rotate-180" />
               </button>
               
               {Array.from({ length: totalPages }).map((_, i) => {
                 const p = i + 1;
                 // Hiển thị một số trang giới hạn (đơn giản hóa)
                 if (
                   p === 1 || 
                   p === totalPages || 
                   (p >= page - 1 && p <= page + 1)
                 ) {
                   return (
                     <button 
                       key={p}
                       onClick={() => { searchParams.set('page', p.toString()); setSearchParams(searchParams); }}
                       className={`w-9 h-9 flex items-center justify-center rounded-lg ${page === p ? 'bg-[#0052cc] text-white font-medium' : 'border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50'}`}
                     >
                       {p}
                     </button>
                   );
                 }
                 
                 if (p === page - 2 || p === page + 2) {
                   return <span key={p} className="text-gray-400">...</span>;
                 }
                 
                 return null;
               })}

               <button 
                 disabled={page >= totalPages}
                 onClick={() => { searchParams.set('page', (page + 1).toString()); setSearchParams(searchParams); }}
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
