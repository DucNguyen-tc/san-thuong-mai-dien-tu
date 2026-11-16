import { useEffect, useState } from "react";
import type { Order } from "@/services/orderService";
import {
  getPaymentByOrderId,
  refundPayment,
  type PaymentRecord,
} from "@/services/paymentService";

interface AdminOrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    orderId: string,
    newStatus: Order["status"],
  ) => Promise<void>;
}

export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<Order["status"]>("CONFIRMED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
      setActionSuccess(null);
      setActionError(null);

      // Fetch payment record
      setLoadingPayment(true);
      getPaymentByOrderId(order.id)
        .then((res) => setPayment(res))
        .catch(() => setPayment(null))
        .finally(() => setLoadingPayment(false));
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));
  };

  const getOrderStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Chờ thanh toán
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            Đã xác nhận
          </span>
        );
      case "SHIPPING":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            Đang giao hàng
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Hoàn thành
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentStatusBadge = (status?: PaymentRecord["status"]) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
            Đã thanh toán (SUCCESS)
          </span>
        );
      case "PENDING":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
            Chờ thanh toán (PENDING)
          </span>
        );
      case "FAILED":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
            Thất bại (FAILED)
          </span>
        );
      case "REFUNDED":
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
            Đã hoàn tiền (REFUNDED)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
            Chưa tạo GD
          </span>
        );
    }
  };

  const handleSaveStatus = async () => {
    if (selectedStatus === order.status) return;
    setIsSubmitting(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      await onUpdateStatus(order.id, selectedStatus);
      setActionSuccess("Cập nhật trạng thái đơn hàng thành công");
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message ||
          "Không thể cập nhật trạng thái đơn hàng",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!payment || payment.status !== "SUCCESS") return;
    if (!window.confirm("Bạn có chắc chắn muốn hoàn tiền cho giao dịch này?"))
      return;

    setIsSubmitting(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const updated = await refundPayment(payment.id);
      setPayment(updated);
      setActionSuccess("Hoàn tiền giao dịch thành công");
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Lỗi khi hoàn tiền");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-outline-variant">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">
              receipt_long
            </span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Chi tiết đơn hàng #{order.id.split("-")[0].toUpperCase()}
              </h3>
              <p className="text-xs text-gray-500">Mã đầy đủ: {order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Action Messages */}
          {actionSuccess && (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                check_circle
              </span>
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {actionError}
            </div>
          )}

          {/* Status & Overview Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  Trạng thái đơn hàng
                </span>
                {getOrderStatusBadge(order.status)}
              </div>
              <p className="text-xs text-gray-500">
                Ngày khởi tạo:{" "}
                {new Date(order.created_at).toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  Thanh toán ({order.payment_method})
                </span>
                {loadingPayment ? (
                  <span className="text-xs text-gray-400 animate-pulse">
                    Đang tải...
                  </span>
                ) : (
                  getPaymentStatusBadge(payment?.status)
                )}
              </div>
              {payment?.gateway_transaction_id && (
                <p className="text-xs text-gray-500">
                  Mã GD Cổng:{" "}
                  <code className="bg-gray-200/60 px-1.5 py-0.5 rounded text-gray-800">
                    {payment.gateway_transaction_id}
                  </code>
                </p>
              )}
            </div>
          </div>

          {/* Admin Control Panel: Update Order Status */}
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
            <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-lg">
                admin_panel_settings
              </span>
              Xử lý đơn hàng (Quyền Admin)
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cập nhật trạng thái mới
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as Order["status"])
                  }
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING_PAYMENT">
                    Chờ thanh toán (PENDING_PAYMENT)
                  </option>
                  <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
                  <option value="SHIPPING">Đang giao hàng (SHIPPING)</option>
                  <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                  <option value="CANCELLED">Hủy đơn hàng (CANCELLED)</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleSaveStatus}
                  disabled={isSubmitting || selectedStatus === order.status}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  )}
                  Lưu thay đổi
                </button>

                {payment &&
                  payment.status === "SUCCESS" &&
                  order.status === "CANCELLED" && (
                    <button
                      onClick={handleRefund}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 text-sm font-bold text-cyan-800 bg-cyan-100 hover:bg-cyan-200 border border-cyan-300 rounded-xl transition-colors cursor-pointer"
                    >
                      Hoàn tiền khách
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Customer & Shipping Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-100 space-y-2 bg-white shadow-xs">
              <h5 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  location_on
                </span>
                Địa chỉ giao hàng
              </h5>
              <p className="text-sm font-medium text-gray-800 whitespace-pre-line">
                {order.shipping_address}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 space-y-2 bg-white shadow-xs">
              <h5 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">
                  person
                </span>
                Mã khách hàng
              </h5>
              <p className="text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-200">
                {order.customer_id}
              </p>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-bold text-xs uppercase text-gray-600 tracking-wider">
              Danh sách sản phẩm trong đơn
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.product_image_snapshot ? (
                        <img
                          src={item.product_image_snapshot}
                          alt={item.product_name_snapshot}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-gray-400">
                          image
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h6 className="text-sm font-semibold text-gray-900 truncate">
                        {item.product_name_snapshot}
                      </h6>
                      <p className="text-xs text-gray-500">
                        {Object.values(
                          item.variant_attributes_snapshot || {},
                        ).join(" - ")}
                      </p>
                      <p className="text-xs font-medium text-gray-600 mt-1">
                        Đơn giá: {formatPrice(Number(item.unit_price_snapshot))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-500">
                      SL:{" "}
                      <span className="font-bold text-gray-800">
                        x{item.quantity}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-1">
                      {formatPrice(Number(item.line_total))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 max-w-sm ml-auto text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính:</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển:</span>
              <span>{formatPrice(Number(order.shipping_fee))}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Giảm giá:</span>
                <span>-{formatPrice(Number(order.discount_amount))}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-base text-gray-900">
              <span>Tổng thanh toán:</span>
              <span className="text-orange-600 text-lg">
                {formatPrice(Number(order.total_amount))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
