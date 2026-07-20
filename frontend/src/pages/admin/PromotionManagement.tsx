import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Tag, Percent, DollarSign, Eye } from 'lucide-react';
import { getPromotions, createPromotion, updatePromotion, deletePromotion } from '@/services/promotionService';
import type { Promotion } from '@/services/promotionService';
import { formatPrice } from '@/utils/formatters';

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
  });

  const fetchPromotions = () => {
    setIsLoading(true);
    getPromotions()
      .then(setPromotions)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        min_order_value: formData.min_order_value ? formData.min_order_value : null,
        usage_limit: formData.usage_limit ? formData.usage_limit : null,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_to: new Date(formData.valid_to).toISOString(),
      };
      
      if (editingId) {
        await updatePromotion(editingId, payload);
      } else {
        await createPromotion(payload);
      }
      setIsModalOpen(false);
      fetchPromotions();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi hệ thống. Vui lòng kiểm tra lại thông tin.';
      alert(`Thất bại: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mã khuyến mãi này?')) return;
    try {
      await deletePromotion(id);
      fetchPromotions();
    } catch (err) {
      alert('Lỗi khi xóa mã khuyến mãi');
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
            Quản lý Khuyến mãi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo và theo dõi các chương trình giảm giá, mã coupon cho khách hàng.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              code: '', name: '', discount_type: 'PERCENT', discount_value: 0, min_order_value: 0, usage_limit: 0, valid_from: '', valid_to: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0052cc] hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Thêm mã khuyến mãi
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Mã / Tên</th>
                <th className="px-6 py-4 font-semibold">Mức giảm</th>
                <th className="px-6 py-4 font-semibold">Đơn tối thiểu</th>
                <th className="px-6 py-4 font-semibold text-center">Đã dùng / Giới hạn</th>
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
                        <div className="font-bold text-gray-900 mb-1">{promo.code}</div>
                        <div className="text-xs text-gray-500">{promo.name}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-blue-600 flex items-center gap-1">
                        {promo.discount_type === 'PERCENT' ? (
                          <><Percent size={14} /> {promo.discount_value}%</>
                        ) : (
                          <><DollarSign size={14} /> {formatPrice(promo.discount_value)}</>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {promo.min_order_value ? formatPrice(promo.min_order_value) : 'Không'}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {promo.used_count} / {promo.usage_limit || '∞'}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã (Code)</label>
                    <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 uppercase" placeholder="VD: SUMMER2026" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                    <input type="number" min={0} value={formData.min_order_value} onChange={e => setFormData({...formData, min_order_value: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn số lượng (0 = vô hạn)</label>
                    <input type="number" min={0} value={formData.usage_limit} onChange={e => setFormData({...formData, usage_limit: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
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
                <span className="font-semibold text-gray-500">Đơn tối thiểu:</span>
                <span>{viewingPromo.min_order_value ? formatPrice(viewingPromo.min_order_value) : 'Không giới hạn'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Đã dùng / Giới hạn:</span>
                <span>{viewingPromo.used_count} / {viewingPromo.usage_limit || 'Vô hạn'}</span>
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
