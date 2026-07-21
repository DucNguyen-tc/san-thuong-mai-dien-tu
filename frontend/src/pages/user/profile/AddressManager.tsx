import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';

interface Address {
  id: string;
  receiver_name: string | null;
  phone: string | null;
  address_line: string;
  is_default: boolean;
}

const AddressManager: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ address_line: '', phone: '', receiver_name: '' });

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, formData);
      } else {
        await api.post('/addresses', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ address_line: '', phone: '', receiver_name: '' });
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({
      address_line: addr.address_line,
      phone: addr.phone || '',
      receiver_name: addr.receiver_name || '',
    });
    setShowModal(true);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      fetchAddresses();
    } catch {
      alert('Không thể đặt mặc định');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa địa chỉ');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">Sổ địa chỉ</h2>
            <p className="text-sm text-outline mt-1">Quản lý thông tin địa chỉ giao hàng của bạn</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ address_line: '', phone: '', receiver_name: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm địa chỉ mới
          </button>
        </div>

        {/* Address Cards */}
        <div className="p-6 space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12 text-outline">
              <span className="material-symbols-outlined text-5xl mb-3 block">location_off</span>
              <p className="text-base">Bạn chưa có địa chỉ nào.</p>
              <p className="text-sm">Hãy thêm địa chỉ giao hàng đầu tiên của bạn.</p>
            </div>
          ) : (
            addresses.map(addr => (
              <div
                key={addr.id}
                className={`p-4 rounded-xl border transition-all ${
                  addr.is_default ? 'border-primary bg-primary-fixed/30' : 'border-outline-variant hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-on-surface">{addr.receiver_name || 'Không tên'}</h3>
                        <span className="text-outline">|</span>
                        <span className="text-sm text-on-surface-variant">{addr.phone || 'Chưa có SĐT'}</span>
                        {addr.is_default && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-primary bg-primary-fixed rounded-full border border-primary/20">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant">{addr.address_line}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Đặt mặc định
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClick(addr)}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="text-xs text-error font-semibold hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="p-6 border-b border-outline-variant">
              <h2 className="text-xl font-semibold text-on-surface">{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-outline uppercase tracking-wider">Tên người nhận *</label>
                <input
                  type="text"
                  required
                  value={formData.receiver_name}
                  onChange={e => setFormData({ ...formData, receiver_name: e.target.value })}
                  className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Nhập tên người nhận"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-outline uppercase tracking-wider">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-outline uppercase tracking-wider">Địa chỉ chi tiết *</label>
                <input
                  type="text"
                  required
                  value={formData.address_line}
                  onChange={e => setFormData({ ...formData, address_line: e.target.value })}
                  className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Số nhà, tên đường, phường/xã..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  className="px-5 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressManager;
