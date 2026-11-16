import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  User,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  Save,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Mail,
  Shield,
  FileText,
  MessageSquare,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { supportService } from "@/services/support.service";
import type {
  Ticket,
  TicketResponse,
  TicketPriority,
  TicketSentiment,
  TicketStatus,
  RagChunk,
} from "@/types/support";
import toast from "react-hot-toast";

export const AdminTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data states
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  // Draft Editor States
  const [editorText, setEditorText] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  // Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approving, setApproving] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [revisionInstruction, setRevisionInstruction] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // New message state
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Accordion state for RAG chunks
  const [expandedChunks, setExpandedChunks] = useState<Record<number, boolean>>({});

  // Fetch Ticket Data
  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await supportService.getAdminTicketDetail(id);
      setTicket(data);

      // Latest response (AI draft or saved response)
      const latestResp = data.responses && data.responses.length > 0 ? data.responses[0] : null;
      if (latestResp) {
        setEditorText(latestResp.final_response || latestResp.ai_draft || "");
        setStaffNotes(latestResp.staff_notes || "");
      }
    } catch (err: any) {
      console.error("Lỗi khi tải chi tiết ticket:", err);
      toast.error(err?.response?.data?.message || "Không thể tải thông tin ticket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const latestResponse: TicketResponse | undefined =
    ticket?.responses && ticket.responses.length > 0 ? ticket.responses[0] : undefined;

  // Toggle RAG chunk view
  const toggleChunk = (index: number) => {
    setExpandedChunks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // 1. Lưu bản nháp (updateDraft)
  const handleSaveDraft = async () => {
    if (!id || !latestResponse) return;
    if (!editorText.trim()) {
      toast.error("Vui lòng nhập nội dung bản nháp");
      return;
    }

    try {
      setSavingDraft(true);
      await supportService.updateDraft(id, {
        final_response: editorText,
        staff_notes: staffNotes,
      });
      toast.success("Đã lưu bản nháp thành công!");
      fetchDetail();
    } catch (err: any) {
      console.error("Lỗi lưu draft:", err);
      toast.error(err?.response?.data?.message || "Không thể lưu bản nháp");
    } finally {
      setSavingDraft(false);
    }
  };

  // 2. Yêu cầu AI viết lại kèm chỉ dẫn (rejectDraft)
  const handleRejectAndRegenerate = async () => {
    if (!id) return;
    if (!revisionInstruction.trim()) {
      toast.error("Vui lòng nhập chỉ dẫn điều chỉnh cho AI");
      return;
    }

    try {
      setRejecting(true);
      const newDraft = await supportService.rejectDraft(id, {
        revision_instruction: revisionInstruction.trim(),
      });
      toast.success("AI đã soạn lại bản nháp mới!");
      setShowRejectModal(false);
      setRevisionInstruction("");
      setEditorText(newDraft.ai_draft || "");
      fetchDetail();
    } catch (err: any) {
      console.error("Lỗi khi yêu cầu AI viết lại:", err);
      toast.error(err?.response?.data?.message || "Không thể soạn lại draft");
    } finally {
      setRejecting(false);
    }
  };

  // 3. Duyệt & Gửi Email (approveAndSend)
  const handleApproveAndSend = async () => {
    if (!id) return;
    if (!editorText.trim()) {
      toast.error("Nội dung phản hồi không được để trống");
      return;
    }

    try {
      setApproving(true);
      await supportService.approveAndSend(id, {
        final_response: editorText,
        staff_notes: staffNotes,
      });
      toast.success("Đã duyệt & gửi email phản hồi thành công đến khách hàng!");
      setShowApproveModal(false);
      fetchDetail();
    } catch (err: any) {
      console.error("Lỗi duyệt & gửi:", err);
      toast.error(err?.response?.data?.message || "Không thể duyệt và gửi phản hồi");
    } finally {
      setApproving(false);
    }
  };

  // 4. Gửi tin nhắn trao đổi bổ sung
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      await supportService.addMessage(id, newMessage.trim());
      setNewMessage("");
      toast.success("Đã gửi tin nhắn!");
      fetchDetail();
    } catch (err: any) {
      console.error("Lỗi gửi tin nhắn:", err);
      toast.error(err?.response?.data?.message || "Không thể gửi tin nhắn");
    } finally {
      setSendingMessage(false);
    }
  };

  // Helper Badge Renders
  const renderPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case "P1":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm">
            🔴 P1 - Khẩn cấp
          </span>
        );
      case "P2":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-sm">
            🟠 P2 - Ưu tiên cao
          </span>
        );
      case "P3":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            🟡 P3 - Trung bình
          </span>
        );
      case "P4":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
            🟢 P4 - Thấp
          </span>
        );
      default:
        return <span>{p}</span>;
    }
  };

  const renderSentimentBadge = (s?: TicketSentiment | null) => {
    switch (s) {
      case "ANGRY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <span>🔴</span> Giận dữ (Angry)
          </span>
        );
      case "FRUSTRATED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <span>🟠</span> Bức xúc (Frustrated)
          </span>
        );
      case "DISAPPOINTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span>🟡</span> Thất vọng (Disappointed)
          </span>
        );
      case "NEUTRAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span>🟢</span> Bình thường (Neutral)
          </span>
        );
      default:
        return <span className="text-xs text-gray-400 italic">Chưa xác định</span>;
    }
  };

  const renderStatusBadge = (st: TicketStatus) => {
    switch (st) {
      case "OPEN":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Mới tiếp nhận
          </span>
        );
      case "ANALYZING":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> AI Đang phân tích...
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> Chờ CSKH duyệt
          </span>
        );
      case "RESPONDED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Đã phản hồi
          </span>
        );
      case "REOPENED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            Khách phản hồi lại
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
            Đã giải quyết
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-300 text-gray-600">
            Đã đóng
          </span>
        );
      default:
        return <span className="text-xs">{st}</span>;
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
        <p className="mt-3 text-sm font-medium text-gray-600">
          Đang tải chi tiết ticket & dữ liệu AI Copilot...
        </p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Không tìm thấy Ticket</h2>
        <p className="text-sm text-gray-500 mt-1">Ticket không tồn tại hoặc bạn không có quyền truy cập.</p>
        <button
          onClick={() => navigate("/admin/tickets")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Parse rag_chunks_used safely
  const ragChunks: RagChunk[] = Array.isArray(latestResponse?.rag_chunks_used)
    ? latestResponse!.rag_chunks_used
    : [];

  const confidence = latestResponse?.ai_confidence ?? null;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/tickets")}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl font-bold text-blue-600">
                {ticket.ticket_number}
              </span>
              {renderStatusBadge(ticket.status)}
              {renderPriorityBadge(ticket.priority)}
              {ticket.source === "AI_ESCALATE" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Bot className="w-3.5 h-3.5 text-indigo-600" /> Tự động Escalate từ AI Chat
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-gray-900 mt-1">
              {ticket.subject}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-gray-500">
            Tạo lúc: <strong className="text-gray-700">{formatDate(ticket.created_at)}</strong>
          </span>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* CỘT TRÁI (60% ~ 7 cols): THÔNG TIN, AI ANALYSIS & TIMELINE */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Phân Tích Thông Minh từ AI (AI Analysis) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Phân Tích Cảm Xúc & Phân Hạng từ AI
                  </h2>
                  <p className="text-xs text-gray-500">
                    Tự động nhận diện mức độ bức xúc và phân loại vấn đề
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                AI Analyzer
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Row 1: Sentiment Badge + Urgency Score Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Cảm xúc khách hàng
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    {renderSentimentBadge(ticket.sentiment)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Chỉ số giận dữ (Sentiment Score)
                    </label>
                    <span className="text-xs font-bold font-mono text-gray-800">
                      {ticket.sentiment_score ?? 0} / 100
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (ticket.sentiment_score ?? 0) >= 80
                          ? "bg-red-600"
                          : (ticket.sentiment_score ?? 0) >= 60
                          ? "bg-orange-500"
                          : (ticket.sentiment_score ?? 0) >= 40
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, ticket.sentiment_score ?? 0)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Priority & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Mức độ ưu tiên
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    {renderPriorityBadge(ticket.priority)}
                    <span className="text-xs text-gray-500">
                      {ticket.priority === "P1" && "(Cần can thiệp khẩn cấp)"}
                      {ticket.priority === "P2" && "(Xử lý trong 4 giờ)"}
                      {ticket.priority === "P3" && "(Xử lý trong 24 giờ)"}
                      {ticket.priority === "P4" && "(Xử lý thông thường)"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Danh mục AI phân loại
                  </label>
                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                      {ticket.ai_category || ticket.category || "OTHER"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: AI Summary */}
              {ticket.ai_summary && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tóm tắt vấn đề trọng tâm (AI Summary)</span>
                  </label>
                  <div className="mt-1.5 p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-sm text-gray-800 leading-relaxed font-medium">
                    "{ticket.ai_summary}"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Thông tin Ticket & Khách hàng */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span>Thông Tin Khách Hàng & Đơn Hàng</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xs text-gray-400">Khách hàng</span>
                <p className="font-semibold text-gray-900">
                  {ticket.customer_name || "Khách hàng"}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span>{ticket.customer_email}</span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                <span className="text-xs text-gray-400">Đơn hàng liên quan</span>
                {ticket.related_order_id ? (
                  <p className="font-semibold text-blue-600 flex items-center gap-1">
                    <span className="font-mono">{ticket.related_order_id}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    Không đính kèm đơn hàng
                  </p>
                )}
                <span className="text-[11px] text-gray-400 block">
                  Kênh tạo: {ticket.source === "AI_ESCALATE" ? "🤖 AI Escalate" : "📝 Form"}
                </span>
              </div>
            </div>

            {/* AI Escalate context notice */}
            {ticket.source === "AI_ESCALATE" && (
              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-lg flex items-start gap-2 text-xs text-indigo-900">
                <Bot className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Ngữ cảnh AI Escalate: </span>
                  Ticket này được trợ lý AI mua sắm tự động kích hoạt khi nhận diện khách hàng bức xúc trong quá trình chat.
                  {ticket.chat_session_id && (
                    <span className="block mt-0.5 text-indigo-700 font-mono text-[11px]">
                      Session ID: {ticket.chat_session_id}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Timeline Lịch Sử Trao Đổi (Messages) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span>Lịch Sử Trao Đổi ({ticket.messages?.length || 0})</span>
            </h3>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {!ticket.messages || ticket.messages.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">
                  Chưa có tin nhắn nào trong lịch sử
                </p>
              ) : (
                ticket.messages.map((msg, idx) => {
                  const isCustomer = msg.sender_type === "CUSTOMER";
                  const isStaff = msg.sender_type === "STAFF";

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        isStaff ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isStaff
                            ? "bg-blue-600 text-white"
                            : isCustomer
                            ? "bg-gray-200 text-gray-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {isStaff ? (
                          <Shield className="w-4 h-4" />
                        ) : isCustomer ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>

                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-sm shadow-xs ${
                          isStaff
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : isCustomer
                            ? "bg-gray-100 text-gray-900 rounded-tl-none border border-gray-200"
                            : "bg-purple-50 text-purple-900 border border-purple-200 rounded-tl-none"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 text-[11px] mb-1 font-semibold ${
                            isStaff ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          <span>
                            {isStaff
                              ? "Nhân viên CSKH"
                              : isCustomer
                              ? ticket.customer_name || "Khách hàng"
                              : "Hệ thống"}
                          </span>
                          <span>•</span>
                          <span className="font-normal">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        <div className="whitespace-pre-line leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick reply message form */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Gửi thêm tin nhắn trong luồng trao đổi
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập nội dung tin nhắn gửi khách..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI (40% ~ 5 cols): AI COPILOT DRAFT & HUMAN-IN-THE-LOOP */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Box 1: AI Copilot Draft Card & RAG References */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    AI Auto-Draft (RAG Engine)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Bản nháp tự động dựa trên chính sách sàn
                  </p>
                </div>
              </div>

              {latestResponse?.ai_tone && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                  Tone: {latestResponse.ai_tone}
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Confidence Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-600">
                    Độ tin cậy của AI (Confidence)
                  </span>
                  <span className="font-bold font-mono text-gray-900">
                    {confidence !== null ? `${confidence}%` : "Chưa chấm điểm"}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (confidence ?? 0) >= 80
                        ? "bg-emerald-500"
                        : (confidence ?? 0) >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, confidence ?? 0))}%`,
                    }}
                  />
                </div>

                {/* Warning if confidence < 50% */}
                {confidence !== null && confidence < 50 && (
                  <div className="mt-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Cảnh báo:</strong> Độ tự tin của AI thấp ({confidence}%). Chính sách trong hệ thống có thể chưa đủ bao quát vấn đề này. Nhân viên vui lòng đối soát kỹ trước khi duyệt gửi!
                    </div>
                  </div>
                )}
              </div>

              {/* RAG Knowledge Base Chunks Used */}
              {ragChunks.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="text-xs font-semibold text-gray-600 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      Chính sách đã tham chiếu ({ragChunks.length})
                    </span>
                    <span className="text-[11px] text-gray-400">Click để xem trích dẫn</span>
                  </label>

                  <div className="space-y-2">
                    {ragChunks.map((chunk, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg text-xs bg-gray-50/50 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleChunk(idx)}
                          className="w-full px-3 py-2 text-left font-medium text-gray-700 flex items-center justify-between hover:bg-gray-100 transition cursor-pointer"
                        >
                          <span className="line-clamp-1 font-semibold text-blue-800">
                            📜 {chunk.document_title || `Tài liệu chính sách #${chunk.chunk_id || idx + 1}`}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {chunk.score && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">
                                Match: {Math.round(chunk.score * 100)}%
                              </span>
                            )}
                            {expandedChunks[idx] ? (
                              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {expandedChunks[idx] && (
                          <div className="px-3 py-2.5 bg-white text-gray-600 border-t border-gray-200 leading-relaxed font-mono text-[11px]">
                            {chunk.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Khung Chỉnh Sửa Phản Hồi (Human-in-the-loop Editor) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Nội Dung Phản Hồi Cho Khách</span>
              </h3>

              {latestResponse?.ai_draft && (
                <button
                  type="button"
                  onClick={() => {
                    setEditorText(latestResponse.ai_draft);
                    toast.success("Đã khôi phục lại bản nháp ban đầu của AI!");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Dùng lại AI Draft</span>
                </button>
              )}
            </div>

            <div>
              <textarea
                rows={9}
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                placeholder="Nhập hoặc chỉnh sửa nội dung phản hồi gửi đến khách hàng..."
                className="w-full p-3.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                <span>Email sẽ được gửi trực tiếp tới: {ticket.customer_email}</span>
                <span>{editorText.length} ký tự</span>
              </div>
            </div>

            {/* Ghi chú nội bộ (Staff Notes) */}
            <div className="pt-3 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Ghi chú nội bộ CSKH (Không gửi cho khách hàng)
              </label>
              <textarea
                rows={2}
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder="Ghi lại lý do duyệt, hướng xử lý kho vận/kế toán..."
                className="w-full p-2.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none bg-gray-50/50"
              />
            </div>

            {/* Action Buttons: HITL Workflow */}
            <div className="pt-3 border-t border-gray-100 space-y-2.5">
              {/* Duyệt & Gửi Email — Main CTA Button */}
              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                disabled={!editorText.trim() || ticket.status === "RESOLVED" || ticket.status === "CLOSED"}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Duyệt & Gửi Email Cho Khách</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Yêu cầu AI viết lại */}
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={ticket.status === "RESOLVED" || ticket.status === "CLOSED"}
                  className="py-2.5 px-3 border border-purple-300 text-purple-700 bg-purple-50/60 hover:bg-purple-100 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Yêu cầu AI viết lại</span>
                </button>

                {/* Lưu nháp */}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft || !editorText.trim()}
                  className="py-2.5 px-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-gray-500" />
                  <span>{savingDraft ? "Đang lưu..." : "Lưu nháp"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: XÁC NHẬN DUYỆT & GỬI EMAIL (HITL CONFIRM) */}
      {/* ========================================================= */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Xác Nhận Duyệt & Gửi Email
                </h3>
                <p className="text-xs text-gray-500">
                  Email phản hồi chính thức sẽ được gửi tới khách hàng
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-2">
              <div>
                <span className="text-gray-400">Người nhận: </span>
                <strong className="text-gray-800">{ticket.customer_email}</strong> (
                {ticket.customer_name || "Khách hàng"})
              </div>
              <div>
                <span className="text-gray-400">Tiêu đề email: </span>
                <strong className="text-gray-800">
                  [{ticket.ticket_number}] Phản hồi yêu cầu hỗ trợ: {ticket.subject}
                </strong>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-400 block mb-1">Nội dung xem trước:</span>
                <div className="max-h-36 overflow-y-auto p-2 bg-white rounded border border-gray-200 whitespace-pre-line text-gray-700 leading-relaxed">
                  {editorText}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                disabled={approving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleApproveAndSend}
                disabled={approving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {approving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Xác nhận & Gửi ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: YÊU CẦU AI VIẾT LẠI (REJECT DRAFT + INSTRUCTIONS) */}
      {/* ========================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Yêu Cầu AI Viết Lại Bản Nháp
                </h3>
                <p className="text-xs text-gray-500">
                  Cung cấp hướng dẫn để AI điều chỉnh giọng văn và nội dung phản hồi
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Chỉ dẫn điều chỉnh cho AI (Revision Instruction) *
              </label>
              <textarea
                rows={4}
                value={revisionInstruction}
                onChange={(e) => setRevisionInstruction(e.target.value)}
                placeholder="Ví dụ: Giọng văn mềm mỏng hơn, xin lỗi chân thành về việc giao trễ 5 ngày, cam kết bồi thường voucher 50.000đ và hoàn tiền trong 24h..."
                className="w-full p-3 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                AI sẽ kết hợp phản hồi từ bạn và tái truy vấn RAG Knowledge Base để sinh bản nháp mới tối ưu hơn.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={rejecting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRejectAndRegenerate}
                disabled={rejecting || !revisionInstruction.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {rejecting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>AI đang viết lại...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gửi chỉ dẫn & Sinh nháp mới</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTicketDetail;

