import { useEffect, useState, useCallback } from "react";
import {
  getOrders,
  updateOrderStatus,
  type Order,
} from "@/services/orderService";
import {
  getPaymentByOrderId,
  type PaymentRecord,
} from "@/services/paymentService";
import { AdminOrderDetailModal } from "./AdminOrderDetailModal";

type OrderStatusFilter = "ALL" | Order["status"];

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<string, PaymentRecord>>(
    {},
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState<OrderStatusFilter>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [searchOrderId, setSearchOrderId] = useState<string>("");
  const [searchCustomerId, setSearchCustomerId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusQuery = activeTab === "ALL" ? undefined : activeTab;
      const res = await getOrders({ status: statusQuery, page, limit: 10 });
      setOrders(res.items);
      setPagination(
        res.pagination || { totalPages: 1, total: res.items.length },
      );

      // Fetch payment statuses for visible orders
      const paymentPromises = res.items.map(async (order) => {
        try {
          const p = await getPaymentByOrderId(order.id);
          return { orderId: order.id, payment: p };
        } catch {
          return { orderId: order.id, payment: null };
        }
      });

      const paymentResults = await Promise.all(paymentPromises);
      const newMap: Record<string, PaymentRecord> = {};
      paymentResults.forEach((item) => {
        if (item.payment) {
          newMap[item.orderId] = item.payment;
        }
      });
      setPaymentsMap(newMap);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Không thể tải danh sách đơn hàng",
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    await updateOrderStatus(orderId, newStatus);
    // Refresh list and selected modal order
    await fetchOrders();
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    }
  };

  const formatPrice = (amount: number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount));
  };

  const getOrderStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Chờ thanh toán
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            Đã xác nhận
          </span>
        );
      case "SHIPPING":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            Đang giao
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Hoàn thành
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentBadge = (
    method: Order["payment_method"],
    payment?: PaymentRecord,
  ) => {
    let methodBg = "bg-gray-100 text-gray-800 border-gray-200";
    if (method === "VNPAY")
      methodBg = "bg-blue-50 text-blue-700 border-blue-200";
    if (method === "MOMO")
      methodBg = "bg-pink-50 text-pink-700 border-pink-200";
    if (method === "CASH")
      methodBg = "bg-emerald-50 text-emerald-700 border-emerald-200";

    let statusDot = "bg-gray-400";
    let statusText = payment?.status || "PENDING";
    if (payment?.status === "SUCCESS") statusDot = "bg-green-500";
    if (payment?.status === "FAILED") statusDot = "bg-red-500";
    if (payment?.status === "REFUNDED") statusDot = "bg-cyan-500";

    return (
      <div className="flex flex-col gap-1 items-start">
        <span
          className={`px-2 py-0.5 text-[11px] font-bold rounded border ${methodBg}`}
        >
          {method}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
          <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
          <span>{statusText}</span>
        </div>
      </div>
    );
  };

  // Filter orders by multiple criteria
  const filteredOrders = orders.filter((o) => {
    // 1. Payment method
    if (selectedMethod !== "ALL" && o.payment_method !== selectedMethod)
      return false;

    // 2. Search by Order ID
    if (
      searchOrderId &&
      !o.id.toLowerCase().includes(searchOrderId.toLowerCase())
    )
      return false;

    // 3. Search by Customer ID
    if (
      searchCustomerId &&
      !o.customer_id.toLowerCase().includes(searchCustomerId.toLowerCase())
    )
      return false;

    // 4. Date range filter
    if (startDate) {
      const orderDate = new Date(o.created_at);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (orderDate < start) return false;
    }
    if (endDate) {
      const orderDate = new Date(o.created_at);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate > end) return false;
    }

    return true;
  });

  const clearAllFilters = () => {
    setSearchOrderId("");
    setSearchCustomerId("");
    setStartDate("");
    setEndDate("");
    setSelectedMethod("ALL");
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Đơn hàng & Thanh toán
          </h1>
          <p className="text-sm text-gray-500">
            Theo dõi, duyệt đơn và quản lý trạng thái thanh toán toàn hệ thống
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}
          >
            refresh
          </span>
          Làm mới
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <span className="material-symbols-outlined text-2xl">
              shopping_bag
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng đơn hàng</p>
            <h3 className="text-xl font-bold text-gray-900">
              {pagination.total}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <span className="material-symbols-outlined text-2xl">
              hourglass_empty
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">
              Chờ duyệt / Thanh toán
            </p>
            <h3 className="text-xl font-bold text-gray-900">
              {
                orders.filter(
                  (o) =>
                    o.status === "PENDING_PAYMENT" || o.status === "CONFIRMED",
                ).length
              }
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <span className="material-symbols-outlined text-2xl">
              local_shipping
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Đang giao hàng</p>
            <h3 className="text-xl font-bold text-gray-900">
              {orders.filter((o) => o.status === "SHIPPING").length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Đơn hoàn thành</p>
            <h3 className="text-xl font-bold text-gray-900">
              {orders.filter((o) => o.status === "COMPLETED").length}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Method Dropdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          {/* Order Status Tabs */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "PENDING_PAYMENT", label: "Chờ thanh toán" },
              { id: "CONFIRMED", label: "Đã xác nhận" },
              { id: "SHIPPING", label: "Đang giao" },
              { id: "COMPLETED", label: "Hoàn thành" },
              { id: "CANCELLED", label: "Đã hủy" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as OrderStatusFilter);
                  setPage(1);
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">
              Cổng thanh toán:
            </span>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl p-2 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả cổng</option>
              <option value="VNPAY">VNPAY</option>
              <option value="MOMO">MoMo</option>
              <option value="CASH">Tiền mặt (CASH)</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200/60">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Mã đơn hàng
            </label>
            <input
              type="text"
              placeholder="Nhập mã đơn hàng..."
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Mã khách hàng
            </label>
            <input
              type="text"
              placeholder="Nhập mã khách hàng..."
              value={searchCustomerId}
              onChange={(e) => setSearchCustomerId(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-700 text-xs rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-700 text-xs rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Clear Filters Button (Only show when filters are active) */}
        {(searchOrderId ||
          searchCustomerId ||
          startDate ||
          endDate ||
          selectedMethod !== "ALL") && (
          <div className="flex justify-end">
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                filter_alt_off
              </span>
              Xóa bộ lọc nâng cao
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                <th className="py-3 px-4">Mã đơn & Ngày đặt</th>
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Thành tiền</th>
                <th className="py-3 px-4">Thanh toán</th>
                <th className="py-3 px-4">Trạng thái đơn</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-3xl animate-spin mb-2 block">
                      progress_activity
                    </span>
                    Đang tải dữ liệu đơn hàng...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-400 font-medium"
                  >
                    Không tìm thấy đơn hàng nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Order ID & Date */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900 uppercase">
                        #{order.id.split("-")[0]}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </div>
                    </td>

                    {/* Products preview */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="text-xs font-semibold text-gray-800 truncate">
                        {order.items[0]?.product_name_snapshot || "Sản phẩm"}
                      </div>
                      {order.items.length > 1 && (
                        <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                          + {order.items.length - 1} sản phẩm khác
                        </div>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-4 font-bold text-orange-600 whitespace-nowrap">
                      {formatPrice(order.total_amount)}
                    </td>

                    {/* Payment Info */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getPaymentBadge(
                        order.payment_method,
                        paymentsMap[order.id],
                      )}
                    </td>

                    {/* Order Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getOrderStatusBadge(order.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status advance button */}
                        {order.status === "CONFIRMED" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, "SHIPPING")
                            }
                            className="px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Giao hàng
                          </button>
                        )}
                        {order.status === "SHIPPING" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(order.id, "COMPLETED")
                            }
                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Hoàn thành
                          </button>
                        )}

                        {/* View detail button */}
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm">
            <span className="text-xs text-gray-500">
              Trang <span className="font-bold text-gray-900">{page}</span> /{" "}
              {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                Trang trước
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Order Detail Modal */}
      <AdminOrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
