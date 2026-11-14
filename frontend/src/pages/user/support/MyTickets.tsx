import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supportService } from "../../../services/support.service";
import type { Ticket } from "../../../types/support";
import { PlusCircle, MessageSquare, Clock, CheckCircle2, ChevronRight, X, Send } from "lucide-react";

export const MyTickets: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await supportService.getMyTickets({ limit: 50 });
      setTickets(data?.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openTicketDetail = async (ticket: Ticket) => {
    try {
      const full = await supportService.getTicketDetail(ticket.id);
      setSelectedTicket(full);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      setSendingReply(true);
      await supportService.addMessage(selectedTicket.id, replyMessage.trim());
      setReplyMessage("");
      // Reload chi tiết
      const updated = await supportService.getTicketDetail(selectedTicket.id);
      setSelectedTicket(updated);
      fetchTickets();
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "RESPONDED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"><CheckCircle2 className="w-3.5 h-3.5" /> Đã có phản hồi</span>;
      case "RESOLVED":
      case "CLOSED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Đã giải quyết</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700"><Clock className="w-3.5 h-3.5" /> Đang xử lý</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yêu Cầu Hỗ Trợ Của Tôi</h1>
          <p className="text-gray-500 text-sm mt-1">Theo dõi tiến độ giải quyết khiếu nại và phản hồi từ đội ngũ CSKH</p>
        </div>
        <button
          onClick={() => navigate("/support/new-ticket")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" /> Tạo yêu cầu mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải danh sách...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có yêu cầu hỗ trợ nào</h3>
          <p className="text-gray-500 text-sm mb-4">Bạn có thắc mắc hoặc cần giải quyết sự cố đơn hàng? Hãy gửi yêu cầu cho chúng tôi.</p>
          <button
            onClick={() => navigate("/support/new-ticket")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Gửi yêu cầu ngay
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => openTicketDetail(t)}
              className="p-4 sm:p-5 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {t.ticket_number}
                  </span>
                  {renderStatusBadge(t.status)}
                </div>
                <h3 className="text-base font-semibold text-gray-900 truncate mb-1">{t.subject}</h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{new Date(t.created_at).toLocaleString("vi-VN")}</span>
                  <span>•</span>
                  <span>{t._count?.messages || 0} tin nhắn</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Modal / Drawer Chi tiết Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-blue-600">{selectedTicket.ticket_number}</span>
                  {renderStatusBadge(selectedTicket.status)}
                </div>
                <h2 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
              {selectedTicket.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender_type === "CUSTOMER" ? "items-end" : "items-start"}`}
                >
                  <span className="text-[11px] text-gray-400 mb-1">
                    {msg.sender_type === "CUSTOMER" ? "Bạn" : "Nhân viên CSKH"} • {new Date(msg.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender_type === "CUSTOMER"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Reply */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100 flex gap-2 bg-white">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Nhập phản hồi thêm cho CSKH..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyMessage.trim()}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
