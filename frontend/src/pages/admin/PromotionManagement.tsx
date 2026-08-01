import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Tag, Percent, DollarSign, Eye } from 'lucide-react';
import { getPromotions, createPromotion, updatePromotion, deletePromotion, addPromotionItem } from '@/services/promotionService';
import type { Promotion } from '@/services/promotionService';
import { formatPrice } from '@/utils/formatters';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPromo, setViewingPromo] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    discount_type: 'PERCENT' as 'PERCENT' | 'FIXED',
    discount_value: 0,
    min_order_value: 0,
    usage_limit: 0,
    valid_from: '',
    valid_to: '',
    applicable_product_id: '',
    applicable_category_id: '',
  });

  const [categories, setCategories] = useState<any[]>([]);

  const fetchPromotions = () => {
    setIsLoading(true);
    getPromotions()
      .then(setPromotions)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPromotions();
    import('@/services/categoryService').then(m => m.getCategoryTree().then(setCategories));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code || `SALE-${Date.now()}`,
        name: formData.name,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_order_value: 0,
        usage_limit: undefined,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_to: new Date(formData.valid_to).toISOString(),
      };
      
      let savedPromo;
      if (editingId) {
        await updatePromotion(editingId, payload);
        savedPromo = { id: editingId };
      } else {
        savedPromo = await createPromotion(payload);
      }
      
      if (formData.applicable_product_id) {
        try {
          await addPromotionItem(savedPromo.id, formData.applicable_product_id);
        } catch (e) {
          console.warn('Failed to add applicable product, ID might be invalid');
        }
      }

      if (formData.applicable_category_id) {
        try {
          await import('@/lib/axios').then(m => m.default.post(`/catalog/promotions/${savedPromo.id}/items/category`, {
            category_id: formData.applicable_category_id
          }));
        } catch (e) {
          console.warn('Failed to add category to promotion');
        }
      }

      toast.success(editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
      setIsModalOpen(false);
      fetchPromotions();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi hệ thống. Vui lòng kiểm tra lại thông tin.';
      toast.error(`Thất bại: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Mã khuyến mãi này sẽ bị xóa và không thể khôi phục!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Có, xóa nó!',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    try {
      await deletePromotion(id);
      toast.success('Xóa mã khuyến mãi thành công');
      fetchPromotions();
    } catch (err) {
      toast.error('Lỗi khi xóa mã khuyến mãi');
    }
  };

  const handleEdit = (promo: Promotion) => {
    setEditingId(promo.id);
    setFormData({
      code: promo.code,
      name: promo.name,
      discount_type: promo.discount_type,
      discount_value: Number(promo.discount_value),
      min_order_value: promo.min_order_value ? Number(promo.min_order_value) : 0,
      usage_limit: promo.usage_limit ? Number(promo.usage_limit) : 0,
      valid_from: new Date(promo.valid_from).toISOString().slice(0, 16),
      valid_to: new Date(promo.valid_to).toISOString().slice(0, 16),
      applicable_product_id: '',
      applicable_category_id: '',
    });
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="text-blue-600" />
            Chương trình Giảm giá / Sale
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các chương trình Flash Sale, giảm giá trực tiếp trên sản phẩm.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              code: '', name: '', discount_type: 'PERCENT', discount_value: 0, min_order_value: 0, usage_limit: 0, valid_from: '', valid_to: '', applicable_product_id: '', applicable_category_id: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tạo chương trình Sale
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên chương trình</th>
                <th className="px-6 py-4 font-semibold">Mức giảm</th>
                <th className="px-6 py-4 font-semibold">Thời hạn</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500"><Loader2 className="animate-spin inline-block mr-2" size={20} />Đang tải...</td></tr>
              ) : promotions.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500">Chưa có mã khuyến mãi nào.</td></tr>
              ) : (
                promotions.map((promo) => {
                  const now = new Date();
                  const isExpired = new Date(promo.valid_to) < now;
                  
                  return (
                    <tr key={promo.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 mb-1">{promo.name}</div>
                        {promo.code && <div className="text-xs text-gray-500">Mã: {promo.code}</div>}
                      </td>
                      <td className="px-6 py-4 font-medium text-blue-600 flex items-center gap-1">
                        {promo.discount_type === 'PERCENT' ? (
                          <><Percent size={14} /> {promo.discount_value}%</>
                        ) : (
                          <><DollarSign size={14} /> {formatPrice(promo.discount_value)}</>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        <div>Từ: {new Date(promo.valid_from).toLocaleDateString('vi-VN')}</div>
                        <div>Đến: {new Date(promo.valid_to).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isExpired ? (
                          <span className="inline-flex bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">Hết hạn</span>
                        ) : promo.is_active ? (
                          <span className="inline-flex bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Đang chạy</span>
                        ) : (
                          <span className="inline-flex bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">Đã tắt</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button className="text-gray-400 hover:text-blue-600 transition-colors" onClick={() => setViewingPromo(promo)} title="Xem chi tiết"><Eye size={18} /></button>
                          <button className="text-gray-400 hover:text-gray-900 transition-colors" onClick={() => handleEdit(promo)} title="Sửa"><Pencil size={18} /></button>
                          <button className="text-gray-400 hover:text-red-600 transition-colors" onClick={() => handleDelete(promo.id)} title="Xóa"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Sửa mã khuyến mãi' : 'Thêm mã khuyến mãi'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="promoForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình Sale</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="VD: Siêu Sale Giữa Năm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                    <select value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value as any})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                      <option value="PERCENT">Theo phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mức giảm</label>
                    <input required type="number" min={1} value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>



                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                    <input required type="datetime-local" value={formData.valid_from} onChange={e => setFormData({...formData, valid_from: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                    <input required type="datetime-local" value={formData.valid_to} onChange={e => setFormData({...formData, valid_to: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Áp dụng THÊM cho Danh mục (Tuỳ chọn)</label>
                    <select 
                      value={formData.applicable_category_id}
                      onChange={e => setFormData({...formData, applicable_category_id: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Bỏ qua (không chọn) --</option>
                      {categories.map(cat => (
                        <optgroup key={cat.id} label={cat.name}>
                          <option value={cat.id}>{cat.name}</option>
                          {cat.children?.map((child: any) => (
                            <option key={child.id} value={child.id}>-- {child.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Sẽ tự động thêm các SP trong danh mục vào đợt Sale này. Do đây là thao tác thêm hàng loạt (Bulk Add), tuỳ chọn này sẽ không lưu trạng thái sau khi đóng.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hoặc thêm ID Sản phẩm (Tùy chọn)</label>
                    <input type="text" value={formData.applicable_product_id} onChange={e => setFormData({...formData, applicable_product_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="VD: 550e8400..." />
                    <p className="text-xs text-gray-500 mt-1">Bỏ trống nếu không thêm SP cụ thể.</p>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
                Hủy
              </button>
              <button type="submit" form="promoForm" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center">
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                Lưu mã khuyến mãi
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Modal */}
      {viewingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Chi tiết Khuyến Mãi</h2>
              <button onClick={() => setViewingPromo(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-700">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Mã (Code):</span>
                <span className="font-bold text-gray-900">{viewingPromo.code}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Tên:</span>
                <span>{viewingPromo.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Loại giảm giá:</span>
                <span>{viewingPromo.discount_type === 'PERCENT' ? 'Phần trăm' : 'Tiền mặt'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Mức giảm:</span>
                <span className="font-bold text-blue-600">
                  {viewingPromo.discount_type === 'PERCENT' ? `${viewingPromo.discount_value}%` : formatPrice(viewingPromo.discount_value)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Thời gian hiệu lực:</span>
                <div className="text-right">
                  <div>{new Date(viewingPromo.valid_from).toLocaleString('vi-VN')}</div>
                  <div className="text-gray-400">đến</div>
                  <div>{new Date(viewingPromo.valid_to).toLocaleString('vi-VN')}</div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button onClick={() => setViewingPromo(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
