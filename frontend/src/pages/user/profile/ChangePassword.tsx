import React, { useState } from 'react';
import api from '@/lib/axios';

const ChangePassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.patch('/users/change-password', {
        old_password: formData.old_password,
        new_password: formData.new_password,
      });
      setSuccessMsg('Đổi mật khẩu thành công');
      setFormData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
      <div className="p-6 border-b border-outline-variant">
        <h2 className="text-2xl font-semibold text-on-surface">Đổi mật khẩu</h2>
        <p className="text-sm text-outline mt-1">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác.</p>
      </div>

      {successMsg && <div className="mx-6 mt-4 p-3 text-sm text-green-700 bg-green-50 rounded-lg">{successMsg}</div>}
      {errorMsg && <div className="mx-6 mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg">{errorMsg}</div>}

      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-md">
        <div className="space-y-1">
          <label className="text-xs text-outline uppercase tracking-wider">Mật khẩu hiện tại</label>
          <input
            type="password"
            name="old_password"
            required
            value={formData.old_password}
            onChange={handleChange}
            className="w-full p-3 border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Nhập mật khẩu hiện tại"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-outline uppercase tracking-wider">Mật khẩu mới</label>
          <input
            type="password"
            name="new_password"
            required
            minLength={6}
            value={formData.new_password}
            onChange={handleChange}
            className="w-full p-3 border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Ít nhất 6 ký tự"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-outline uppercase tracking-wider">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            name="confirm_password"
            required
            value={formData.confirm_password}
            onChange={handleChange}
            className="w-full p-3 border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
