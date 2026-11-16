import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Search, Filter, TrendingUp, Eye } from 'lucide-react';
import { getProducts, deleteProduct } from '@/services/productService';
import type { CatalogProduct } from '@/types/catalog';
import { getDisplayPrice, getPrimaryImageUrl, getTotalAvailableStock } from '@/types/catalog';
import { formatPrice } from '@/utils/formatters';
import ProductModal from '@/components/admin/ProductModal';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function ProductManagement() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [viewingProduct, setViewingProduct] = useState<CatalogProduct | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchProducts = () => {
    let isCancelled = false;
    setIsLoading(true);

    getProducts({ 
      page: currentPage, 
      limit: 10, 
      includeInactive: true,
      search: debouncedSearch || undefined,
      category_id: selectedCategory || undefined
    })
      .then((result) => {
        if (!isCancelled) {
          setProducts(result.items);
          setTotalProducts(result.pagination?.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  };

  useEffect(() => {
    import('@/services/categoryService').then(m => m.getCategoryTree().then(setCategories));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    return fetchProducts();
  }, [debouncedSearch, selectedCategory, currentPage]);

  const filteredProducts = products.filter(product => {
    if (selectedStatus) {
      const stock = getTotalAvailableStock(product);
      if (selectedStatus === 'IN_STOCK' && stock <= 0) return false;
      if (selectedStatus === 'OUT_OF_STOCK' && stock > 0) return false;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Sản phẩm này sẽ bị xóa và không thể khôi phục!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Có, xóa nó!',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    try {
      await deleteProduct(id);
      toast.success('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (error) {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  const handleEdit = (product: CatalogProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen p-8">
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }} 
        onSuccess={() => fetchProducts()} 
        editingProduct={editingProduct}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và cập nhật thông tin sản phẩm trong hệ thống của bạn.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none bg-white max-w-[200px]"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(cat => (
            <optgroup key={cat.id} label={cat.name}>
              <option value={cat.id}>{cat.name}</option>
              {cat.children?.map((child: any) => (
                <option key={child.id} value={child.id}>-- {child.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="IN_STOCK">Còn hàng</option>
          <option value="OUT_OF_STOCK">Hết hàng</option>
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
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-500">Chưa có sản phẩm nào phù hợp với bộ lọc.</td></tr>
              ) : (
                filteredProducts.map((product) => {
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
                        <div className="text-xs text-gray-500">SKU: APP-{product.id?.split('-')?.[0]?.toUpperCase() || 'UNKNOWN'}</div>
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
                          <button className="text-gray-400 hover:text-blue-600 transition-colors" onClick={() => setViewingProduct(product)} title="Xem chi tiết"><Eye size={18} /></button>
                          <button className="text-gray-400 hover:text-gray-900 transition-colors" onClick={() => handleEdit(product)} title="Sửa"><Pencil size={18} /></button>
                          <button className="text-gray-400 hover:text-red-600 transition-colors" onClick={() => handleDelete(product.id)} title="Xóa"><Trash2 size={18} /></button>
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
           <span className="text-sm text-gray-500">Hiển thị {filteredProducts.length} trên tổng số {totalProducts} sản phẩm</span>
           {totalProducts > 0 && (
             <div className="flex gap-1">
                <button 
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 text-sm disabled:opacity-50"
                >&lt;</button>
                
                {Array.from({ length: Math.ceil(totalProducts / 10) }).map((_, i) => {
                  const p = i + 1;
                  const totalPages = Math.ceil(totalProducts / 10);
                  if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                    return (
                      <button 
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm ${currentPage === p ? 'bg-[#0052cc] text-white font-medium' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === currentPage - 2 || p === currentPage + 2) {
                    return <span key={p} className="w-8 h-8 flex items-center justify-center text-gray-500 text-sm">...</span>;
                  }
                  return null;
                })}
                
                <button 
                  disabled={currentPage >= Math.ceil(totalProducts / 10)}
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalProducts / 10), p + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 text-sm disabled:opacity-50"
                >&gt;</button>
             </div>
           )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Tổng số sản phẩm</h3>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-[#0052cc]">{totalProducts.toLocaleString('vi-VN')}</span>
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

      {/* View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Chi tiết sản phẩm</h2>
              <button onClick={() => setViewingProduct(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-700">
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 bg-gray-50 rounded-xl border border-gray-200 p-2">
                  <img src={getPrimaryImageUrl(viewingProduct) || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Tên sản phẩm:</span>
                <span className="font-bold text-gray-900">{viewingProduct.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Mã SKU:</span>
                <span>APP-{viewingProduct.id?.split('-')?.[0]?.toUpperCase() || 'UNKNOWN'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Danh mục:</span>
                <span>{viewingProduct.category?.name || 'Không có'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Giá cơ bản:</span>
                <span className="font-bold text-blue-600">{formatPrice(getDisplayPrice(viewingProduct))}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Tồn kho:</span>
                <span>{getTotalAvailableStock(viewingProduct)} sản phẩm</span>
              </div>
              <div className="border-b pb-2">
                <span className="font-semibold text-gray-500 block mb-1">Mô tả:</span>
                <p className="text-gray-600 whitespace-pre-wrap">{viewingProduct.description || 'Không có mô tả'}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button onClick={() => setViewingProduct(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium">Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
