import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '@/lib/axios';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  auth_provider: string;
  created_at: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    is_active: true
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=${limit}`);
      setUsers(res.data.data.users);
      setTotal(res.data.data.total);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const result = await Swal.fire({
      title: 'Xác nhận thay đổi',
      text: `Bạn có chắc chắn muốn ${currentStatus ? 'chặn' : 'mở khóa'} người dùng này?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      toast.success('Cập nhật trạng thái thành công');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEditClick = (user: User) => {
    setEditingId(user.id);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editingId) {
        await api.put(`/admin/users/${editingId}`, formData);
      } else {
        await api.post('/admin/users', formData);
      }
      setShowModal(false);
      toast.success('Lưu người dùng thành công');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu người dùng');
    } finally {
      setModalLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const getInitialColor = (name: string) => {
    const colors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700'];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Quản lý người dùng</h1>
          <p className="text-sm text-on-surface-variant mt-1">Xem và quản lý tất cả người dùng, vai trò và trạng thái trên nền tảng.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ full_name: '', email: '', password: '', role: 'CUSTOMER', is_active: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          + Thêm người dùng mới
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
          />
        </div>
        <select className="px-4 py-2.5 border border-outline-variant rounded-lg bg-white text-sm text-on-surface-variant focus:ring-2 focus:ring-primary outline-none">
          <option>Tất cả vai trò</option>
          <option>Quản trị</option>
          <option>Khách hàng</option>
        </select>
        <select className="px-4 py-2.5 border border-outline-variant rounded-lg bg-white text-sm text-on-surface-variant focus:ring-2 focus:ring-primary outline-none">
          <option>Tất cả trạng thái</option>
          <option>Hoạt động</option>
          <option>Đã chặn</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                <th className="px-6 py-3 text-xs text-on-surface-variant font-semibold uppercase tracking-wider">MÃ ID</th>
                <th className="px-6 py-3 text-xs text-on-surface-variant font-semibold uppercase tracking-wider">NGƯỜI DÙNG</th>
                <th className="px-6 py-3 text-xs text-on-surface-variant font-semibold uppercase tracking-wider">ĐIỆN THOẠI</th>
                <th className="px-6 py-3 text-xs text-on-surface-variant font-semibold uppercase tracking-wider">VAI TRÒ</th>
                <th className="px-6 py-3 text-xs text-on-surface-variant font-semibold uppercase tracking-wider">TRẠNG THÁI</th>
                <th className="px-6 py-3 text-xs text-on-surface-variant font-semibold uppercase tracking-wider">NGÀY THAM GIA</th>
                <th className="px-6 py-3 text-xs text-on-surface-variant font-semibold uppercase tracking-wider text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-outline">
                    <span className="material-symbols-outlined text-4xl animate-spin block mb-2">progress_activity</span>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-outline">Không tìm thấy người dùng</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-on-surface-variant">#{user.id.substring(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getInitialColor(user.full_name)}`}>
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{user.full_name}</p>
                          <p className="text-xs text-outline">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">—</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {user.role === 'ADMIN' ? 'Quản trị' : 'Khách hàng'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {user.is_active ? 'Hoạt động' : 'Đã chặn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-1.5 rounded-lg hover:bg-surface-container transition-colors" 
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className="p-1.5 rounded-lg hover:bg-surface-container transition-colors"
                            title={user.is_active ? 'Chặn tài khoản' : 'Mở khóa'}
                          >
                            <span className={`material-symbols-outlined text-[18px] ${user.is_active ? 'text-on-surface-variant' : 'text-green-600'}`}>
                              {user.is_active ? 'block' : 'check_circle'}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-outline-variant flex justify-between items-center">
          <span className="text-sm text-on-surface-variant">
            Hiển thị {Math.min((page - 1) * limit + 1, total)} đến {Math.min(page * limit, total)} trên tổng số {total} người dùng
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg border border-outline-variant disabled:opacity-30 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  page === p ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                {p}
              </button>
            ))}
            {totalPages > 3 && <span className="px-1 text-outline">...</span>}
            {totalPages > 3 && (
              <button
                onClick={() => setPage(totalPages)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  page === totalPages ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                {totalPages}
              </button>
            )}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg border border-outline-variant disabled:opacity-30 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Tổng người dùng</p>
          <p className="text-3xl font-bold text-primary">{total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Đang hoạt động</p>
          <p className="text-3xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
          <p className="text-xs text-green-600 mt-1">● Theo dõi trực tiếp</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Vai trò quản trị</p>
          <p className="text-3xl font-bold text-on-surface">{users.filter(u => u.role === 'ADMIN').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Quyền truy cập nội bộ</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-5">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Đã chặn</p>
          <p className="text-3xl font-bold text-red-600">{users.filter(u => !u.is_active).length}</p>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="p-6 border-b border-outline-variant">
              <h2 className="text-xl font-semibold text-on-surface">{editingId ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-outline uppercase tracking-wider">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-outline uppercase tracking-wider">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Địa chỉ email"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-outline uppercase tracking-wider">Mật khẩu {!editingId && '*'}</label>
                <input
                  type="password"
                  required={!editingId}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder={editingId ? "Bỏ trống nếu không muốn đổi mật khẩu (Chưa hỗ trợ API đổi MK ở đây)" : "Mật khẩu cho tài khoản"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-outline uppercase tracking-wider">Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                  >
                    <option value="CUSTOMER">Khách hàng</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-outline uppercase tracking-wider">Trạng thái</label>
                  <select
                    value={formData.is_active.toString()}
                    onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full p-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Đã chặn</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-all disabled:opacity-50"
                >
                  {modalLoading ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
