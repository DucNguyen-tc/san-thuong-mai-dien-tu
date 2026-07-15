import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Search, Filter, TrendingUp } from 'lucide-react';
import { getProducts } from '@/services/productService';
import type { CatalogProduct } from '@/types/catalog';
import { getDisplayPrice, getPrimaryImageUrl, getTotalAvailableStock } from '@/types/catalog';
import { formatPrice } from '@/utils/formatters';

export default function ProductManagement() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    getProducts({ page: 1, limit: 50, includeInactive: true })
      .then((result) => {
        if (!isCancelled) setProducts(result.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và cập nhật thông tin sản phẩm trong hệ thống của bạn.
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Thêm sản phẩm
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm tên sản phẩm, mã SKU..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
        <select className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none bg-white">
          <option>Tất cả danh mục</option>
          <option>Điện thoại</option>
          <option>Laptop</option>
        </select>
        <select className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none bg-white">
          <option>Tất cả trạng thái</option>
          <option>Đang bán</option>
          <option>Hết hàng</option>
        </select>
        <button className="flex items-center gap-2 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
          <Filter size={16} /> Bộ lọc nâng cao
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /></th>
                <th className="px-6 py-4 font-semibold">Ảnh</th>
                <th className="px-6 py-4 font-semibold">Tên sản phẩm</th>
                <th className="px-6 py-4 font-semibold">Danh mục</th>
                <th className="px-6 py-4 font-semibold">Giá</th>
                <th className="px-6 py-4 font-semibold text-center">Tồn kho</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-500"><Loader2 className="animate-spin inline-block mr-2" size={20} />Đang tải...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-500">Chưa có sản phẩm nào.</td></tr>
              ) : (
                products.map((product) => {
                  const stock = getTotalAvailableStock(product);
                  const isOutOfStock = stock <= 0;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /></td>
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden p-1">
                          <img src={getPrimaryImageUrl(product) || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-contain" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-600 mb-1">{product.name}</div>
                        <div className="text-xs text-gray-500">SKU: APP-{product.id.split('-')[0].toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{product.category?.name || 'Chưa phân loại'}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(getDisplayPrice(product))}</td>
                      <td className={`px-6 py-4 font-medium text-center ${isOutOfStock ? 'text-red-500' : 'text-gray-900'}`}>{stock}</td>
                      <td className="px-6 py-4 text-center">
                        {product.is_active ? (
                          <span className="inline-flex bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Đang bán</span>
                        ) : (
                          <span className="inline-flex bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">Nháp</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button className="text-gray-400 hover:text-gray-700 transition-colors"><Pencil size={18} /></button>
                          <button className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
           <span className="text-sm text-gray-500">Hiển thị 1-1 trên tổng số {products.length} sản phẩm</span>
           <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 text-sm">&lt;</button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-[#0052cc] text-white font-medium text-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">3</button>
              <span className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm">...</span>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">30</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 text-sm">&gt;</button>
           </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Tổng số sản phẩm</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-[#0052cc]">1,280</span>
            <div className="flex items-center text-green-600 text-sm font-medium"><TrendingUp size={16} className="mr-1" />+12% tháng này</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Giá trị kho hàng</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-gray-900">3.4B ₫</span>
            <div className="text-gray-500 text-sm font-medium">Ổn định</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Sản phẩm sắp hết</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-red-600">12</span>
            <button className="text-blue-600 text-sm font-medium hover:underline">Xem ngay</button>
          </div>
        </div>
      </div>

    </div>
  );
}
