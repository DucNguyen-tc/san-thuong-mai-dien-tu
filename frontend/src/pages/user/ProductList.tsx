import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Heart, Search, ShoppingCart, Star, Filter, ArrowRight } from 'lucide-react';
import { getProducts } from '@/services/productService';
import type { CatalogProduct } from '@/types/catalog';
import { getDisplayPrice, getPrimaryImageUrl } from '@/types/catalog';
import { formatPrice } from '@/utils/formatters';

export default function ProductList() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    getProducts({ page: 1, limit: 12 })
      .then((result) => {
        if (!isCancelled) setProducts(result.items);
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
  }, []);

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
                {['Điện thoại & Tablet', 'Laptop & Gaming', 'Phụ kiện công nghệ', 'Âm thanh'].map((cat, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      defaultChecked={idx === 1}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className={`text-sm ${idx === 1 ? 'text-blue-600 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Khoảng giá */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Khoảng giá</h3>
              <div className="relative w-full h-1 bg-gray-200 rounded-full mb-4">
                <div className="absolute left-[20%] right-[30%] h-full bg-blue-600 rounded-full"></div>
                <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full shadow cursor-pointer border-2 border-white"></div>
                <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full shadow cursor-pointer border-2 border-white"></div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>0đ</span>
                <span>100tr+</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Từ" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                <span className="text-gray-400">-</span>
                <input type="text" placeholder="Đến" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
            </div>

            {/* Thương hiệu */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Thương hiệu</h3>
              <div className="space-y-2.5">
                {['Apple', 'Samsung', 'ASUS'].map((brand, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Đánh giá */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Đánh giá</h3>
              <div className="flex items-center gap-1 cursor-pointer group">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} size={16} className={star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                ))}
                <span className="text-sm text-gray-600 ml-1 group-hover:text-gray-900">(Từ 4 sao)</span>
              </div>
            </div>

            <button className="w-full bg-[#0052cc] hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              Áp dụng bộ lọc
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Thanh sắp xếp */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 mb-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sắp xếp theo:</span>
              <div className="flex items-center gap-2">
                <button className="px-4 py-1.5 bg-[#0052cc] text-white text-sm font-medium rounded-full">Phổ biến</button>
                <button className="px-4 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium rounded-full transition-colors">Mới nhất</button>
                <button className="px-4 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium rounded-full transition-colors">Bán chạy</button>
              </div>
            </div>
            <div className="flex items-center gap-2 cursor-pointer border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300">
              <span className="text-sm text-gray-700">Giá: Thấp đến Cao</span>
              <ChevronDown size={16} className="text-gray-500" />
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
                    
                    {/* Mock Badges */}
                    {i === 0 && <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">-20%</div>}
                    {i === 1 && <div className="absolute top-3 left-3 bg-[#0052cc] text-white text-xs font-bold px-2 py-1 rounded">Mới</div>}
                    {i === 2 && <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">-15%</div>}
                    {i === 4 && <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">-10%</div>}

                    {/* Wishlist button */}
                    <button 
                      onClick={(e) => { e.preventDefault(); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white shadow-sm transition-colors"
                    >
                      <Heart size={18} />
                    </button>
                  </div>

                  {/* Info area */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="mt-auto">
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-[#0052cc] font-bold">{formatPrice(getDisplayPrice(product))}</span>
                        {i % 2 === 0 && (
                          <span className="text-gray-400 text-xs line-through">{formatPrice(getDisplayPrice(product) * 1.2)}</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={(e) => { e.preventDefault(); alert('Đã thêm vào giỏ hàng!'); }}
                        className="w-full py-2 bg-[#f39c12] hover:bg-[#e67e22] text-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShoppingCart size={16} />
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                Không tìm thấy sản phẩm nào.
              </div>
            )}
            
            {/* Mock remaining cards to match design layout if real products are < 8 */}
            {!isLoading && products.length > 0 && Array.from({ length: Math.max(0, 8 - products.length) }).map((_, i) => (
              <div key={`mock-${i}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col opacity-60">
                <div className="relative aspect-square bg-gray-50 overflow-hidden p-4">
                  <img src="https://via.placeholder.com/300?text=Sắp+về+hàng" alt="Mock" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-medium text-gray-900 text-sm mb-2">Sản phẩm sắp ra mắt (Demo)</h3>
                  <div className="mt-auto">
                     <span className="text-[#0052cc] font-bold">10.000.000đ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex justify-center items-center gap-2">
             <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"><ChevronRight size={18} className="rotate-180" /></button>
             <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0052cc] text-white font-medium">1</button>
             <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50">2</button>
             <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50">3</button>
             <span className="text-gray-400">...</span>
             <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50">10</button>
             <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"><ChevronRight size={18} /></button>
          </div>

        </div>
      </div>
      

    </div>
  );
}
