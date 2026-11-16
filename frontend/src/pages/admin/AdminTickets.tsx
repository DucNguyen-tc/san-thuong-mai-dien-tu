import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LifeBuoy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Bot,
  FileText,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { supportService } from "@/services/support.service";
import type {
  Ticket,
  TicketPriority,
  TicketSentiment,
  TicketStatus,
  AdminTicketStats,
} from "@/types/support";
import toast from "react-hot-toast";

export const AdminTickets: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<AdminTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Query
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");
  const [sentiment, setSentiment] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Fetch Tickets
  const fetchTickets = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        else setRefreshing(true);

        const params: any = {
          page,
          limit: 10,
        };
        if (search.trim()) params.search = search.trim();
        if (status !== "ALL") params.status = status as TicketStatus;
        if (priority !== "ALL") params.priority = priority as TicketPriority;
        if (sentiment !== "ALL") params.sentiment = sentiment as TicketSentiment;
        if (category !== "ALL") params.category = category;

        const res = await supportService.getAdminTickets(params);
        setTickets(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err: any) {
        console.error("Lỗi khi tải danh sách ticket:", err);
        toast.error(err?.response?.data?.message || "Không thể tải danh sách ticket");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status, priority, sentiment, category]
  );

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const data = await supportService.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error("Không thể tải thống kê:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPriority("ALL");
    setSentiment("ALL");
    setCategory("ALL");
    setPage(1);
  };

  // Badge Renders
  const renderPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case "P1":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-sm">
            🔴 P1 - Khẩn cấp
          </span>
        );
      case "P2":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white shadow-sm">
            🟠 P2 - Cao
          </span>
        );
      case "P3":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            🟡 P3 - Thường
          </span>
        );
      case "P4":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
            🟢 P4 - Thấp
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{p}</span>;
    }
  };

  const renderSentimentBadge = (
    s?: TicketSentiment | null,
    score?: number | null
  ) => {
    if (!s) {
      return (
        <span className="text-xs text-gray-400 italic">Chưa phân tích</span>
      );
    }

    let config = {
      label: "Bình thường",
      icon: "🟢",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      barBg: "bg-emerald-500",
    };

    if (s === "ANGRY") {
      config = {
        label: "Giận dữ",
        icon: "🔴",
        bg: "bg-red-50 text-red-700 border-red-200",
        barBg: "bg-red-500",
      };
    } else if (s === "FRUSTRATED") {
      config = {
        label: "Bức xúc",
        icon: "🟠",
        bg: "bg-orange-50 text-orange-700 border-orange-200",
        barBg: "bg-orange-500",
      };
    } else if (s === "DISAPPOINTED") {
      config = {
        label: "Thất vọng",
        icon: "🟡",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        barBg: "bg-amber-500",
      };
    }

    return (
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.bg} w-max`}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </span>
        {typeof score === "number" && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <div className="w-14 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${config.barBg}`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
            <span className="font-mono">{score}/100</span>
          </div>
        )}
      </div>
    );
  };

  const renderStatusBadge = (st: TicketStatus) => {
    switch (st) {
      case "OPEN":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Tiếp nhận
          </span>
        );
      case "ANALYZING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
            <Sparkles className="w-3 h-3 text-purple-600" /> AI Đang xử lý
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" /> Chờ duyệt
          </span>
        );
      case "RESPONDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" /> Đã phản hồi
          </span>
        );
      case "REOPENED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Khách phản hồi lại
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
            Đã giải quyết
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-500">
            Đã đóng
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
            {st}
          </span>
        );
    }
  };

  const renderSourceBadge = (src: string) => {
    if (src === "AI_ESCALATE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Bot className="w-3 h-3 text-indigo-600" /> AI Escalate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
        <FileText className="w-3 h-3 text-gray-500" /> Form Web
      </span>
    );
  };

  const formatDate = (isoString: string) => {
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

  const getRelativeTime = (isoString: string) => {
    try {
      const now = new Date().getTime();
      const time = new Date(isoString).getTime();
      const diffMinutes = Math.floor((now - time) / (1000 * 60));

      if (diffMinutes < 1) return "Vừa xong";
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              CSKH AI Copilot — Quản Lý Yêu Cầu Hỗ Trợ
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              <Sparkles className="w-3 h-3" /> HITL System
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi, xử lý ticket thông minh với AI phân tích cảm xúc & gợi ý câu trả lời RAG
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchTickets(true);
              fetchStats();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 text-gray-500 ${
                refreshing ? "animate-spin text-blue-600" : ""
              }`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Tổng số Ticket
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats?.totalTickets ?? pagination.total}
            </p>
            <p className="text-xs text-gray-400 mt-1">Toàn bộ yêu cầu hỗ trợ</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <LifeBuoy className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-700">
              Chờ CSKH Duyệt
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {stats?.byStatus?.["PENDING_REVIEW"] ?? 0}
            </p>
            <p className="text-xs text-amber-600 mt-1">AI đã soạn xong draft</p>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-200 bg-red-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-red-700">
              Khẩn cấp (P1 Critical)
            </p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats?.byPriority?.["P1"] ?? 0}
            </p>
            <p className="text-xs text-red-600 mt-1">Cần can thiệp gấp</p>
          </div>
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
              Đã xử lý & Phản hồi
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {(stats?.byStatus?.["RESPONDED"] || 0) +
                (stats?.byStatus?.["RESOLVED"] || 0)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">Đã gửi email phản hồi</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã TK, tiêu đề, tên hoặc email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2">
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
            >
              <option value="ALL">Mọi ưu tiên</option>
              <option value="P1">🔴 P1 - Khẩn cấp</option>
              <option value="P2">🟠 P2 - Cao</option>
              <option value="P3">🟡 P3 - Thường</option>
              <option value="P4">🟢 P4 - Thấp</option>
            </select>
          </div>

          {/* Sentiment Filter */}
          <div className="md:col-span-2">
            <select
              value={sentiment}
              onChange={(e) => {
                setSentiment(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
            >
              <option value="ALL">Mọi cảm xúc</option>
              <option value="ANGRY">🔴 Giận dữ (Angry)</option>
              <option value="FRUSTRATED">🟠 Bức xúc (Frustrated)</option>
              <option value="DISAPPOINTED">🟡 Thất vọng</option>
              <option value="NEUTRAL">🟢 Bình thường</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="OPEN">Mới tiếp nhận</option>
              <option value="PENDING_REVIEW">Chờ CSKH duyệt</option>
              <option value="RESPONDED">Đã phản hồi</option>
              <option value="REOPENED">Khách phản hồi lại</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
            >
              <option value="ALL">Mọi danh mục</option>
              <option value="REFUND">Hoàn tiền (Refund)</option>
              <option value="SHIPPING">Vận chuyển (Shipping)</option>
              <option value="WARRANTY">Bảo hành (Warranty)</option>
              <option value="PAYMENT">Thanh toán (Payment)</option>
              <option value="ORDER">Đơn hàng (Order)</option>
              <option value="PRODUCT">Sản phẩm (Product)</option>
              <option value="OTHER">Khác (Other)</option>
            </select>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Sắp xếp mặc định: <strong>Ưu tiên P1 → P4</strong>, sau đó đến <strong>Ticket cũ lên trước (FIFO)</strong></span>
          </div>

          {(search ||
            status !== "ALL" ||
            priority !== "ALL" ||
            sentiment !== "ALL" ||
            category !== "ALL") && (
            <button
              onClick={handleResetFilters}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Ticket List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
            <p className="mt-2 text-sm text-gray-500">Đang tải danh sách ticket...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">
              Không tìm thấy yêu cầu hỗ trợ nào
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc hiện tại.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 text-sm bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã Ticket</th>
                  <th className="py-3 px-4">Tiêu đề & Tóm tắt AI</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Cảm xúc & Điểm AI</th>
                  <th className="py-3 px-4">Ưu tiên</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Nguồn</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/admin/tickets/${t.id}`)}
                    className="hover:bg-blue-50/40 transition cursor-pointer group"
                  >
                    {/* Mã Ticket */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-600 group-hover:underline">
                          {t.ticket_number}
                        </span>
                      </div>
                    </td>

                    {/* Tiêu đề & Tóm tắt AI */}
                    <td className="py-3 px-4 max-w-xs md:max-w-md">
                      <div className="font-medium text-gray-900 line-clamp-1">
                        {t.subject}
                      </div>
                      {t.ai_summary ? (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                          <Bot className="w-3 h-3 text-purple-500 shrink-0" />
                          <span>{t.ai_summary}</span>
                        </p>
                      ) : (
                        <span className="text-[11px] text-gray-400">
                          {t.category || "OTHER"}
                        </span>
                      )}
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800">
                        {t.customer_name || "Khách hàng"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t.customer_email}
                      </div>
                    </td>

                    {/* Cảm xúc & Điểm AI */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderSentimentBadge(t.sentiment, t.sentiment_score)}
                    </td>

                    {/* Ưu tiên */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderPriorityBadge(t.priority)}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderStatusBadge(t.status)}
                    </td>

                    {/* Nguồn */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderSourceBadge(t.source)}
                    </td>

                    {/* Thời gian */}
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-500">
                      <div>{getRelativeTime(t.created_at)}</div>
                      <div className="text-[11px] text-gray-400">
                        {formatDate(t.created_at)}
                      </div>
                    </td>

                    {/* Hành động */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <Link
                        to={`/admin/tickets/${t.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                      >
                        <span>Xử lý</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && tickets.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <div>
              Hiển thị{" "}
              <span className="font-semibold text-gray-800">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              -{" "}
              <span className="font-semibold text-gray-800">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              trên tổng số{" "}
              <span className="font-semibold text-gray-800">
                {pagination.total}
              </span>{" "}
              yêu cầu
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trang trước</span>
              </button>

              <span className="px-2 text-xs font-medium text-gray-700">
                Trang {pagination.page} / {pagination.totalPages || 1}
              </span>

              <button
                onClick={() =>
                  setPage((p) =>
                    pagination.totalPages ? Math.min(pagination.totalPages, p + 1) : p + 1
                  )
                }
                disabled={pagination.page >= (pagination.totalPages || 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                <span>Trang sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTickets;

