import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supportService } from "../../../services/support.service";
import orderService from "../../../services/orderService";
import { AlertCircle, CheckCircle, Send, ArrowLeft } from "lucide-react";

export const NewTicket: React.FC = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [content, setContent] = useState("");
  const [relatedOrderId, setRelatedOrderId] = useState("");
  const [orders, setOrders] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  useEffect(() => {
    // Tải danh sách đơn hàng gần đây của khách
    orderService
      .getUserOrders(1, 10)
      .then((res: any) => {
        if (res?.items) setOrders(res.items);
        else if (res?.data?.items) setOrders(res.data.items);
        else if (Array.isArray(res?.data)) setOrders(res.data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      setError("Vui lòng điền đầy đủ tiêu đề và nội dung yêu cầu.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const ticket = await supportService.createTicket({
        subject,
        category,
        content,
        related_order_id: relatedOrderId || undefined
      });
      setCreatedTicketNumber(ticket.ticket_number);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể tạo yêu cầu hỗ trợ. Vui lòng thử lại.");
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
                    Đơn #{order.order_number || order.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung chi tiết <span className="text-red-500">*</span>
            </label>
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

