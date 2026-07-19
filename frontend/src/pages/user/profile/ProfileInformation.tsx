import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';

const ProfileInfo: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: '',
  });

  // Fetch full profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        const data = res.data.data;
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
        });
      } catch {
        // silently fail, use store data
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.put('/users/profile', formData);
      updateUser(res.data.data);
      setSuccessMsg('Cập nhật thông tin thành công');
      setEditing(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-on-surface">Thông tin cá nhân</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Sửa thông tin
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {successMsg && <div className="mx-6 mt-4 p-3 text-sm text-green-700 bg-green-50 rounded-lg">{successMsg}</div>}
      {errorMsg && <div className="mx-6 mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg">{errorMsg}</div>}

      {/* Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs text-outline uppercase tracking-wider">Họ và tên</label>
          {editing ? (
            <input
              type="text"
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full p-2 border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          ) : (
            <p className="text-base text-on-surface">{formData.full_name || '—'}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-outline uppercase tracking-wider">Email</label>
          <p className="text-base text-on-surface">{user?.email || '—'}</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-outline uppercase tracking-wider">Số điện thoại</label>
          {editing ? (
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          ) : (
            <p className="text-base text-on-surface">{formData.phone || 'Chưa cung cấp'}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-outline uppercase tracking-wider">Vai trò</label>
          <p className="text-base text-on-surface">{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;
