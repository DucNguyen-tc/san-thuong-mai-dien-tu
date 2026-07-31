import React from 'react';
import type { Order } from '@/services/orderService';
import { formatPrice } from '@/utils/formatters';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onCancel: (orderId: string) => void;
  isCanceling: boolean;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onCancel,
  isCanceling,
}) => {
  if (!isOpen || !order) return null;

  const canCancel = order.status === 'PENDING_PAYMENT' || order.status === 'CONFIRMED';

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

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'VNPAY': return 'Thanh toán qua VNPAY';
      case 'MOMO': return 'Thanh toán qua Ví MoMo';
      case 'CASH': return 'Thanh toán khi nhận hàng (COD)';
      default: return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant bg-surface-container-light">
          <h2 className="text-xl font-bold text-on-surface">Chi tiết đơn hàng #{order.id.split('-')[0].toUpperCase()}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow bg-surface-container-light/30 space-y-6">
          {/* Order Info & Status */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row justify-between gap-4">
            <div>
              <p className="text-sm text-outline mb-1">Ngày đặt hàng: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-semibold text-on-surface">Trạng thái:</span>
                {getStatusBadge(order.status)}
              </div>
            </div>
            {canCancel && (
              <div className="flex items-end">
                <button
                  onClick={() => onCancel(order.id)}
                  disabled={isCanceling}
                  className="px-4 py-2 bg-error-container text-error hover:bg-error/20 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isCanceling ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                </button>
              </div>
            )}
          </div>

          {/* Shipping & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm">
              <h3 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Địa chỉ nhận hàng
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {order.shipping_address}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm">
              <h3 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Phương thức thanh toán
              </h3>
              <p className="text-sm text-on-surface-variant">
                {getPaymentMethodLabel(order.payment_method)}
              </p>
            </div>
          </div>

          {/* Product List */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm">
            <h3 className="font-semibold text-on-surface mb-4">Sản phẩm đã đặt</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-outline-variant last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-surface-container rounded-lg flex-shrink-0 flex items-center justify-center border border-outline-variant overflow-hidden">
                    {item.product_image_snapshot ? (
                      <img src={item.product_image_snapshot} alt={item.product_name_snapshot} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-outline">image</span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-sm font-medium text-on-surface line-clamp-2">{item.product_name_snapshot}</h4>
                    <p className="text-xs text-outline mt-1">
                      {Object.values(item.variant_attributes_snapshot || {}).join(' - ')}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-primary">
                        {formatPrice(Number(item.unit_price_snapshot))}
                      </span>
                      <span className="text-sm text-on-surface-variant">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm space-y-3">
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Tạm tính</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Phí vận chuyển</span>
              <span>{formatPrice(Number(order.shipping_fee))}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá</span>
                <span>-{formatPrice(Number(order.discount_amount))}</span>
              </div>
            )}
            <div className="pt-3 border-t border-outline-variant flex justify-between items-center">
              <span className="font-semibold text-on-surface">Tổng cộng</span>
              <span className="text-xl font-bold text-primary">{formatPrice(Number(order.total_amount))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
