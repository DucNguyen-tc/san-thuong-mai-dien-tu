import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { supportService } from "../../../services/support.service";
import orderService from "../../../services/orderService";
import { AlertCircle, CheckCircle, Send, ArrowLeft, Package, Calendar, DollarSign } from "lucide-react";

export const NewTicket: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get("orderId");

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [content, setContent] = useState("");
  const [relatedOrderId, setRelatedOrderId] = useState(orderIdFromUrl || "");
  const [orders, setOrders] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  useEffect(() => {
    // Tải danh sách đơn hàng gần đây của khách
    orderService
      .getUserOrders(1, 20)
      .then((res: any) => {
        const orderList = res?.items || res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
        setOrders(orderList);
        if (orderIdFromUrl) {
          setRelatedOrderId(orderIdFromUrl);
        }
      })
      .catch(() => {});
  }, [orderIdFromUrl]);

  const selectedOrder = orders.find((o) => o.id === relatedOrderId);

  const formatOrderOption = (order: any) => {
    const shortId = (order.order_number || order.id.slice(0, 8)).toUpperCase();
    const dateStr = order.created_at
      ? new Date(order.created_at).toLocaleDateString("vi-VN")
      : "";
    const priceStr = order.total_amount
      ? Number(order.total_amount).toLocaleString("vi-VN") + " đ"
      : "";
    const firstItem = order.items?.[0]?.product_name_snapshot || order.items?.[0]?.name || "";
    const moreCount = (order.items?.length || 0) > 1 ? ` (+${order.items.length - 1} sp)` : "";
    const itemText = firstItem ? ` - [${firstItem.length > 22 ? firstItem.slice(0, 22) + "..." : firstItem}${moreCount}]` : "";
    return `Đơn #${shortId} (${dateStr}) - ${priceStr}${itemText}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 2) {
      setError("Vui lòng nhập tiêu đề vấn đề (ít nhất 2 ký tự).");
      return;
    }
    if (content.trim().length < 2) {
      setError("Vui lòng nhập nội dung chi tiết (ít nhất 2 ký tự).");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const ticket = await supportService.createTicket({
        subject: subject.trim(),
        category,
        content: content.trim(),
        related_order_id: relatedOrderId || undefined,
        customer_name: user?.full_name || undefined,
        customer_email: user?.email || undefined
      });
      setCreatedTicketNumber(ticket.ticket_number);
    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        setError(backendErrors.map((e: any) => e.message).join(". "));
      } else {
        setError(err?.response?.data?.message || "Không thể tạo yêu cầu hỗ trợ. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (createdTicketNumber) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã tiếp nhận yêu cầu!</h2>
        <p className="text-gray-600 mb-4">
          Mã số ticket của bạn là <strong className="text-blue-600 font-mono text-lg">{createdTicketNumber}</strong>.
          Hệ thống AI và bộ phận CSKH đang xử lý yêu cầu của bạn.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate("/support/my-tickets")}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            Xem danh sách ticket của tôi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gửi Yêu Cầu Hỗ Trợ / Khiếu Nại</h1>
        <p className="text-gray-500 text-sm mb-6">
          Đội ngũ CSKH và Trợ lý AI luôn sẵn sàng lắng nghe và giải quyết vấn đề của bạn nhanh nhất.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề vấn đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="VD: Đơn hàng giao trễ, Sản phẩm bị vỡ khi nhận..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="SHIPPING">Vận chuyển & Giao hàng</option>
                <option value="REFUND">Đổi trả & Hoàn tiền</option>
                <option value="WARRANTY">Bảo hành</option>
                <option value="PAYMENT">Thanh toán</option>
                <option value="PRODUCT">Chất lượng sản phẩm</option>
                <option value="OTHER">Vấn đề khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn hàng liên quan (tùy chọn)
              </label>
              <select
                value={relatedOrderId}
                onChange={(e) => setRelatedOrderId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Không chọn đơn hàng --</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {formatOrderOption(order)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Order Preview */}
          {selectedOrder && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  Đơn hàng #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedOrder.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="text-gray-700">
                <p className="font-medium text-gray-800 mb-1">Sản phẩm trong đơn:</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <li key={idx} className="truncate">
                      <span className="font-medium text-gray-800">{item.product_name_snapshot}</span> (x{item.quantity}) - {Number(item.line_total || item.unit_price_snapshot).toLocaleString("vi-VN")} đ
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-blue-200/60">
                <span className="text-gray-600">Tổng thanh toán:</span>
                <span className="font-bold text-blue-700 text-sm">
                  {Number(selectedOrder.total_amount).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Nội dung chi tiết <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">
                {content.length > 0 ? `${content.length} ký tự` : "Tối thiểu 2 ký tự"}
              </span>
            </div>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả cụ thể vấn đề bạn gặp phải để chúng tôi hỗ trợ tốt nhất..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? "Đang gửi..." : "Gửi yêu cầu hỗ trợ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewTicket;

