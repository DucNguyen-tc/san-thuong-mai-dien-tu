import React, { useState, useEffect } from 'react';
import { getOrders, cancelOrder } from '@/services/orderService';
import type { Order } from '@/services/orderService';
import { formatPrice } from '@/utils/formatters';
import OrderDetailModal from './OrderDetailModal';

type TabStatus = 'ALL' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';

const TABS: { label: string; value: TabStatus }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ thanh toán', value: 'PENDING_PAYMENT' },
  { label: 'Chờ xác nhận', value: 'CONFIRMED' },
  { label: 'Đang giao', value: 'SHIPPING' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

const OrderManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabStatus>('ALL');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchOrders = async (status: TabStatus, page: number = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (status !== 'ALL') {
        params.status = status;
      }
      const response = await getOrders(params);
      setOrders(response.items || []);
      setPagination({
        page: response.pagination?.page || 1,
        totalPages: response.pagination?.totalPages || 1,
      });
    } catch (error: any) {
      showToast('error', 'Không thể tải danh sách đơn hàng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab, 1);
  }, [activeTab]);

  const handlePageChange = (newPage: number) => {
    fetchOrders(activeTab, newPage);
  };

  const handleCancelOrder = (orderId: string) => {
    setCancelTargetId(orderId);
  };

  const confirmCancelOrder = async () => {
    if (!cancelTargetId) return;
    
    setIsCanceling(true);
    try {
      await cancelOrder(cancelTargetId);
      showToast('success', 'Hủy đơn hàng thành công');
      // Tắt modal nếu đang mở
      setIsModalOpen(false);
      setSelectedOrder(null);
      setCancelTargetId(null);
      // Tải lại danh sách
      fetchOrders(activeTab, pagination.page);
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Lỗi khi hủy đơn hàng');
    } finally {
      setIsCanceling(false);
    }
  };

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">Chờ thanh toán</span>;
      case 'CONFIRMED':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">Chờ xác nhận</span>;
      case 'SHIPPING':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">Đang giao</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">Hoàn thành</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">Đã hủy</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Header & Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant mb-6 overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <h2 className="text-xl font-bold text-on-surface">Quản lý đơn hàng</h2>
        </div>
        <div className="flex overflow-x-auto custom-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-shrink-0 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="flex-grow space-y-4">
        {loading ? (
          <div className="bg-white p-8 rounded-xl border border-outline-variant text-center text-outline">
            <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-outline-variant text-center flex flex-col items-center justify-center h-64">
            <span className="material-symbols-outlined text-5xl text-outline mb-4">receipt_long</span>
            <h3 className="text-lg font-semibold text-on-surface mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-sm text-outline">Không tìm thấy đơn hàng phù hợp với trạng thái hiện tại.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-outline-variant overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200">
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between px-5 py-4 border-b border-outline-variant/60 bg-gray-50/50 gap-2">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">local_mall</span>
                  <span className="text-sm font-bold text-gray-900 tracking-wide uppercase">#{order.id.split('-')[0]}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                  <span className="text-sm text-gray-500 hidden sm:inline-block">
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Order Items Preview */}
              <div className="p-5 space-y-5">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-surface-container rounded-lg border border-outline-variant flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product_image_snapshot ? (
                        <img src={item.product_image_snapshot} alt={item.product_name_snapshot} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-outline">image</span>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 truncate mb-1">{item.product_name_snapshot}</h4>
                      <p className="text-sm text-gray-500">{Object.values(item.variant_attributes_snapshot || {}).join(' - ')}</p>
                      <div className="text-sm font-medium text-gray-600 mt-2 bg-gray-100 inline-block px-2 py-0.5 rounded">SL: {item.quantity}</div>
                    </div>
                    <div className="text-base font-bold text-gray-900 ml-4">
                      {formatPrice(Number(item.unit_price_snapshot))}
                    </div>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <div className="text-sm font-medium text-center text-primary pt-3 border-t border-dashed border-outline-variant cursor-pointer hover:underline" onClick={() => openDetailModal(order)}>
                    Xem thêm {order.items.length - 2} sản phẩm khác...
                  </div>
                )}
              </div>

              {/* Order Footer */}
              <div className="flex flex-wrap items-center justify-between px-5 py-4 border-t border-outline-variant/60 bg-gray-50/50 gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 font-medium">Thành tiền:</span>
                  <span className="text-xl font-bold text-[#ff9900]">{formatPrice(Number(order.total_amount))}</span>
                </div>
                <div className="flex gap-3">
                  {(order.status === 'PENDING_PAYMENT' || order.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={isCanceling}
                      className="px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 disabled:opacity-50"
                    >
                      Hủy đơn
                    </button>
                  )}
                  <button
                    onClick={() => openDetailModal(order)}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-xl transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          
          <span className="text-sm font-medium text-on-surface">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onCancel={handleCancelOrder}
        isCanceling={isCanceling}
      />

      {/* Cancel Confirmation Modal */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
                <h3 className="text-lg font-bold text-gray-900">Xác nhận hủy đơn</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setCancelTargetId(null)}
                  disabled={isCanceling}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Không, giữ lại
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={isCanceling}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCanceling && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                  Có, hủy đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-sm font-medium z-[70] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 ${
          toastMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toastMessage.type === 'success' ? (
            <span className="material-symbols-outlined text-sm">check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-sm">error</span>
          )}
          {toastMessage.text}
        </div>
      )}
    </div>
  );
};

export default OrderManager;
