import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  Bot,
  CheckCircle2,
  ClipboardList,
  History,
  Layers,
  Loader2,
  LogIn,
  MessageSquare,
  MessageSquareDashed,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  ShoppingCart,
  Sparkles,
  Square,
  Ticket,
  Trash2,
  User,
  WifiOff,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  ChatMessage,
  ChatMetadataPayload,
  ChatSessionSummary,
  ProductCardItem,
  SSEConnectionState,
} from '@/types/aiChat';
import {
  checkAiBackendHealth,
  createNewChatSession,
  deleteStoredSession,
  fetchSessionHistory,
  getOrCreateSessionToken,
  getSavedSessionsList,
  saveMessagesToLocalCache,
  setStoredSessionToken,
  streamChatMessage,
} from '@/services/aiChatService';
import { getProductBySlug } from '@/services/productService';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import ChatProductCardList from './ChatProductCard';
import ChatComparisonTable from './ChatComparisonTable';
import ChatOrderCardList from './ChatOrderCard';

const QUICK_PROMPTS = [
  '📱 Tìm điện thoại dưới 15 triệu',
  '⚖️ So sánh iPhone 15 và Samsung S24',
  '🛒 Thêm iPhone 15 vào giỏ',
  '😡 Đơn hàng 5 ngày chưa giao, các bạn lừa đảo à?',
  '🔄 Chính sách đổi trả hàng như thế nào?',
  '🚫 Sàn có bán vũ khí không?',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content:
    'Xin chào! 👋 Mình là **Trợ lý Mua sắm AI**. Mình có thể giúp bạn tìm sản phẩm, so sánh cấu hình (2-4 sản phẩm) hoặc giải đáp chính sách đổi trả, bảo hành. Bạn đang quan tâm đến sản phẩm nào?',
  createdAt: new Date().toISOString(),
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Render nội dung text hỗ trợ định dạng hình ảnh ![alt](url), in đậm **bold** và liên kết [text](url) khi stream từng chunk
 */
function renderFormattedText(content: string, onNavigate?: (url: string) => void): React.ReactNode {
  if (!content) return null;
  // Bóc tách theo markdown image (![alt](url)), markdown link ([text](url)) hoặc bold (**text**)
  const parts = content.split(/(!?\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    // 1. Markdown Image: ![alt](url) hoặc ![alt|targetUrl](url)
    const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      const [altText, targetUrl] = (imgMatch[1] || '').split('|');
      const imgUrl = imgMatch[2];
      return (
        <span
          key={idx}
          onClick={() => {
            if (targetUrl && onNavigate) {
              onNavigate(targetUrl);
            }
          }}
          className={`inline-flex items-center my-0.5 mr-1.5 align-middle overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xs group ${
            targetUrl ? 'cursor-pointer hover:border-blue-400' : ''
          }`}
          title={targetUrl ? `Bấm để xem chi tiết ${altText}` : altText}
        >
          <img
            src={imgUrl}
            alt={altText || 'Sản phẩm'}
            className="w-7 h-7 sm:w-8 sm:h-8 object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </span>
      );
    }

    // 2. Bold text: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 3. Markdown Link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      let linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      // Loại bỏ các ký tự ** bao bọc bên trong link nếu có để hiển thị gọn sạch
      linkText = linkText.replace(/^\*\*|\*\*$/g, '');
      return (
        <a
          key={idx}
          href={linkUrl}
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) {
              onNavigate(linkUrl);
            }
          }}
          className="font-semibold text-primary underline hover:text-blue-700 cursor-pointer transition-colors"
        >
          {linkText}
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingFirstChunk, setIsWaitingFirstChunk] = useState(false);
  const [streamPhase, setStreamPhase] = useState<SSEConnectionState>('idle');
  const [isMockMode, setIsMockMode] = useState(false);
  const [forceMock, setForceMock] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Quản lý Session Chat (Ngày 6-7): Guest/User session token + lịch sử các phiên
  const [activeSessionToken, setActiveSessionToken] = useState<string>('');
  const [savedSessions, setSavedSessions] = useState<ChatSessionSummary[]>([]);
  const [showSessionPanel, setShowSessionPanel] = useState(false);

  const navigate = useNavigate();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { isAuthenticated, user } = useAuthStore();
  const currentUserId = user?.id || null;
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const { addItem, fetchCart } = useCartStore();

  // Khởi tạo Guest/User Session Token từ LocalStorage & Load lịch sử chat theo User
  useEffect(() => {
    const isUserSwitched = prevUserIdRef.current !== undefined && prevUserIdRef.current !== currentUserId;
    prevUserIdRef.current = currentUserId;

    if (isUserSwitched) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
      setIsWaitingFirstChunk(false);
    }

    const token = getOrCreateSessionToken(currentUserId);
    setActiveSessionToken(token);
    setSavedSessions(getSavedSessionsList(currentUserId));
    setIsLoadingHistory(true);

    fetchSessionHistory(token, currentUserId)
      .then((history) => {
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      })
      .catch(() => {
        setMessages([WELCOME_MESSAGE]);
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [currentUserId]);

  // Lắng nghe trạng thái kết nối mạng (Online / Offline) — Ngày 10-11 Error States
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Tối ưu Mobile (Ngày 10-11): Khóa cuộn trang nền khi mở fullscreen chat trên điện thoại & hỗ trợ phím Escape
  useEffect(() => {
    if (!isOpen) return;

    const isMobileViewport = window.innerWidth < 640;
    if (isMobileViewport) {
      document.body.style.overflow = 'hidden';
    }

    const handleKeyDownGlobal = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        if (showSessionPanel) {
          setShowSessionPanel(false);
        } else {
          handleCloseWidget();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDownGlobal);
    };
  }, [isOpen, showSessionPanel]);

  // Kiểm tra kết nối tới endpoint thật /api/ai/chat khi mở cửa sổ chat
  useEffect(() => {
    if (isOpen && !forceMock) {
      checkAiBackendHealth().then((online) => {
        setIsMockMode(!online);
      });
    }
  }, [isOpen, forceMock]);

  // Lưu cache mỗi khi messages thay đổi theo đúng User
  useEffect(() => {
    if (messages.length > 1 && activeSessionToken) {
      saveMessagesToLocalCache(messages, activeSessionToken, currentUserId);
      setSavedSessions(getSavedSessionsList(currentUserId));
    }
  }, [messages, activeSessionToken, currentUserId]);

  // Auto-scroll xuống cuối khi có tin nhắn hoặc chunk mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isWaitingFirstChunk, isOpen]);

  // Focus vào ô input khi mở cửa sổ chat
  useEffect(() => {
    if (isOpen && !isClosing) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, isClosing]);

  const handleOpenWidget = () => {
    setIsClosing(false);
    setIsOpen(true);
  };

  const handleCloseWidget = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setShowSessionPanel(false);
    }, 180);
  };

  const handleScrollMessages = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottomBtn(distanceFromBottom > 120);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottomBtn(false);
  };

  const handleStopStream = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setIsWaitingFirstChunk(false);
    setStreamPhase('idle');
  };

  const handleResetSession = () => {
    handleStopStream();
    const newToken = createNewChatSession(currentUserId);
    setActiveSessionToken(newToken);
    setShowSessionPanel(false);
    setMessages([
      {
        ...WELCOME_MESSAGE,
        createdAt: new Date().toISOString(),
      },
    ]);
    setSavedSessions(getSavedSessionsList(currentUserId));
    toast.success('Đã tạo phiên trò chuyện mới');
  };

  const handleSelectSession = async (sessionToken: string) => {
    handleStopStream();
    setStoredSessionToken(sessionToken, currentUserId);
    setActiveSessionToken(sessionToken);
    setShowSessionPanel(false);
    setIsLoadingHistory(true);

    try {
      const history = await fetchSessionHistory(sessionToken, currentUserId);
      if (history.length > 0) {
        setMessages(history);
        toast.success('Đã khôi phục lịch sử hội thoại');
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteSession = (
    e: React.MouseEvent,
    sessionTokenToDelete: string
  ) => {
    e.stopPropagation();
    const remaining = deleteStoredSession(sessionTokenToDelete, currentUserId);
    setSavedSessions(remaining);

    if (sessionTokenToDelete === activeSessionToken) {
      if (remaining.length > 0) {
        handleSelectSession(remaining[0].session_token);
      } else {
        handleResetSession();
      }
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? inputValue).trim();
    if (!textToSend || isStreaming) return;

    if (!customText) {
      setInputValue('');
    }
    setShowSessionPanel(false);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    const assistantMsgId = `assistant-${Date.now() + 1}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      metadata: null,
      createdAt: new Date().toISOString(),
      isStreaming: true,
      streamState: 'connecting',
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsStreaming(true);
    setIsWaitingFirstChunk(true);
    setStreamPhase('connecting');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedReply = '';

    await streamChatMessage(
      textToSend,
      {
        onSession: (sess) => {
          if (sess.session_token) {
            setActiveSessionToken(sess.session_token);
          }
        },
        onModeChange: (mockFallback) => {
          setIsMockMode(mockFallback);
        },
        onStateChange: (state) => {
          setStreamPhase(state);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, streamState: state } : m
            )
          );
        },
        onTextChunk: (chunk: string) => {
          accumulatedReply += chunk;
          setIsWaitingFirstChunk(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + chunk }
                : m
            )
          );
        },
        onMetadata: (payload: ChatMetadataPayload) => {
          setIsWaitingFirstChunk(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, metadata: payload } : m
            )
          );
        },
        onDone: () => {
          setIsWaitingFirstChunk(false);
          setIsStreaming(false);
          setStreamPhase('done');
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, isStreaming: false, streamState: 'done' }
                : m
            )
          );

          // Đồng bộ lại Giỏ hàng trên Header nếu AI vừa thực thi tool add_to_cart / update / remove
          const lowerReply = accumulatedReply.toLowerCase();
          const isCartAction =
            lowerReply.includes('đã thêm') && lowerReply.includes('giỏ hàng') ||
            lowerReply.includes('đã cập nhật số lượng') ||
            lowerReply.includes('đã xóa sản phẩm');
          if (isCartAction && isAuthenticated) {
            fetchCart().catch(() => {});
          }
        },
        onError: (errMsg: string) => {
          setIsWaitingFirstChunk(false);
          setIsStreaming(false);
          setStreamPhase('error');
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content:
                      m.content ||
                      `Xin lỗi, kết nối tới máy chủ AI đang bị gián đoạn (${errMsg}). Bạn vui lòng bấm "Thử gửi lại" nhé!`,
                    isStreaming: false,
                    streamState: 'error',
                    hasError: true,
                    failedPrompt: textToSend,
                  }
                : m
            )
          );
        },
      },
      { signal: controller.signal, forceMock }
    );

    setIsStreaming(false);
    setIsWaitingFirstChunk(false);
  };

  const handleRetryMessage = (failedMsg: ChatMessage) => {
    if (!failedMsg.failedPrompt || isStreaming) return;
    const promptToRetry = failedMsg.failedPrompt;
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    handleSendMessage(promptToRetry);
  };

  /**
   * Xử lý nút "Thêm giỏ" trên Product Action Card:
   * - Nếu đã có variant_id chuẩn UUID -> gọi thẳng useCartStore.addItem()
   * - Nếu variant_id là mock -> tự động tìm sản phẩm thật theo slug từ catalog-service để lấy variant_id thật
   * - Nếu chưa đăng nhập hoặc API giỏ hàng tắt -> fallback gửi lệnh chat cho AI
   */
  const handleAddToCartFromCard = async (product: ProductCardItem) => {
    if (!isAuthenticated) {
      toast.error('Bạn vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng nhé!');
      handleSendMessage(`Thêm ${product.name} vào giỏ hàng giúp tôi`);
      return;
    }

    let targetProductId = product.id;
    let targetVariantId = product.variant_id;
    let targetPrice = product.price;
    let targetAttributes: Record<string, string> = {};

    const isValidVariantUuid =
      Boolean(targetVariantId) && UUID_REGEX.test(targetVariantId!);

    if (!isValidVariantUuid) {
      try {
        const realProduct = await getProductBySlug(product.slug || product.name);
        if (realProduct) {
          targetProductId = realProduct.id;
          const activeVariant =
            realProduct.variants?.find(
              (v) => v.is_active && v.stock_quantity > 0
            ) || realProduct.variants?.[0];
          if (activeVariant) {
            targetVariantId = activeVariant.id;
            targetPrice = Number(activeVariant.price);
            targetAttributes = activeVariant.attributes || {};
          }
        }
      } catch {
        // Bỏ qua lỗi tra cứu, xử lý tiếp ở dưới
      }
    }

    if (targetVariantId && UUID_REGEX.test(targetVariantId)) {
      try {
        await addItem(targetProductId, targetVariantId, 1, {
          name: product.name,
          price: targetPrice,
          attributes: targetAttributes,
          image_url: product.image_url,
        });
        toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
        return;
      } catch {
        // Nếu gọi trực tiếp thất bại, chuyển sang gửi lệnh chat cho AI
      }
    }

    handleSendMessage(`Thêm sản phẩm "${product.name}" vào giỏ hàng giúp tôi`);
  };

  const handleViewDetailFromCard = () => {
    // Trên màn hình mobile (fullscreen chat), tự động thu gọn khung chat để người dùng thấy trang Chi tiết sản phẩm
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setIsOpen(false);
    }
  };

  const handleNavigateFromChat = (path: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setIsOpen(false);
    }
    navigate(path);
  };

  /**
   * Hiển thị các nút tương tác thông minh (Quick Action Buttons) bên dưới câu trả lời của AI
   * Phục vụ luồng E2E Ngày 8-9:
   * - Yêu cầu đăng nhập khi Guest thao tác Giỏ hàng / Đơn hàng (Mục 6.1)
   * - Xác nhận 2 bước khi Hủy đơn hàng (Mục 6.2)
   * - Xem chi tiết / Hủy đơn khi tra cứu đơn hàng
   * - Mở giỏ hàng sau khi thêm sản phẩm qua chat
   * - Xem danh sách Ticket sau khi AI escalate khiếu nại
   */
  const renderContextualActions = (msg: ChatMessage) => {
    if (msg.role !== 'assistant' || msg.isStreaming || !msg.content) {
      return null;
    }

    const content = msg.content;
    const lower = content.toLowerCase();

    // 1. Khi Guest chưa đăng nhập mà yêu cầu thao tác Giỏ hàng / Đơn hàng
    if (
      content.includes('🔒') ||
      (lower.includes('vui lòng đăng nhập') && !isAuthenticated)
    ) {
      return (
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleNavigateFromChat('/login')}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập ngay</span>
          </button>
        </div>
      );
    }

    // 2. Khi AI trả về danh sách hoặc chi tiết Đơn hàng hoặc hướng dẫn hủy đơn (📦 / 📋)
    if (
      content.includes('📦') ||
      content.includes('📋') ||
      lower.includes('mã đơn: #') ||
      lower.includes('hướng dẫn hủy đơn') ||
      lower.includes('hủy đơn qua chatbot') ||
      lower.includes('đơn hàng')
    ) {
      return (
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleNavigateFromChat('/profile?tab=orders')}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Quản lý đơn hàng</span>
          </button>
        </div>
      );
    }

    // 4. Khi AI vừa thêm sản phẩm vào giỏ hàng hoặc hiển thị giỏ hàng (🛒)
    if (
      content.includes('🛒') &&
      (lower.includes('đã thêm') || lower.includes('giỏ hàng hiện tại'))
    ) {
      return (
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleNavigateFromChat('/cart')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-primary hover:bg-primary/90 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-3 h-3" />
            <span>Mở Giỏ hàng</span>
          </button>
          {lower.includes('đã thêm') && (
            <button
              type="button"
              disabled={isStreaming}
              onClick={() => handleSendMessage('Xem giỏ hàng của tôi')}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <ClipboardList className="w-3 h-3" />
              <span>Kiểm tra giỏ qua AI</span>
            </button>
          )}
        </div>
      );
    }

    // 5. Khi AI vừa chuyển tiếp khiếu nại tạo Ticket CSKH (Mã ticket: TK-...) hoặc hướng dẫn liên hệ CSKH
    if (
      lower.includes('mã ticket:') ||
      content.includes('TK-') ||
      lower.includes('gửi yêu cầu hỗ trợ') ||
      lower.includes('1900-')
    ) {
      return (
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleNavigateFromChat('/support/my-tickets')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Xem phiếu hỗ trợ</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavigateFromChat('/support/new-ticket')}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Tạo phiếu mới</span>
          </button>
          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => handleNavigateFromChat('/admin/tickets')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>CSKH Dashboard</span>
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) góc phải dưới với hiệu ứng mở mượt mà */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpenWidget}
          aria-label="Mở Trợ lý Mua sắm AI"
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-700 hover:to-primary text-white px-4 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group animate-in fade-in zoom-in-90"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6 transition-transform duration-200 group-hover:rotate-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-semibold hidden sm:inline">
            Trợ lý AI
          </span>
        </button>
      )}

      {/* Cửa sổ Chat (Fullscreen 100dvh trên Mobile, Floating Window trên Desktop + Animation mở/đóng) */}
      {isOpen && (
        <div
          className={`fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full h-[100dvh] sm:w-[400px] sm:h-[620px] sm:max-h-[calc(100dvh-48px)] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden origin-bottom-right transition-all duration-200 ease-out ${
            isClosing
              ? 'opacity-0 translate-y-4 sm:scale-95 pointer-events-none'
              : 'opacity-100 translate-y-0 sm:scale-100 animate-in fade-in slide-in-from-bottom-4 duration-200'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold leading-tight">
                    Trợ lý Mua sắm AI
                  </h3>
                  <span
                    onClick={() => setForceMock((v) => !v)}
                    title="Bấm để chuyển đổi Live Backend / Mock SSE"
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium cursor-pointer select-none transition-colors ${
                      forceMock || isMockMode
                        ? 'bg-amber-400/90 text-gray-900'
                        : 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/30'
                    }`}
                  >
                    {forceMock || isMockMode ? 'Mock SSE' : 'Live SSE'}
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      isOffline ? 'bg-amber-400' : 'bg-green-400'
                    }`}
                  />
                  {isStreaming
                    ? streamPhase === 'receiving_metadata'
                      ? 'Đang kết xuất dữ liệu sản phẩm...'
                      : streamPhase === 'connecting'
                      ? 'Đang kết nối tới AI...'
                      : 'Đang trả lời trực tuyến...'
                    : isOffline
                    ? 'Đang ngoại tuyến (Chế độ dự phòng)'
                    : 'Tư vấn sản phẩm & chính sách 24/7'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setSavedSessions(getSavedSessionsList());
                  setShowSessionPanel((prev) => !prev);
                }}
                title="Quản lý phiên & Lịch sử chat"
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  showSessionPanel
                    ? 'bg-white/25 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
              >
                <History className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetSession}
                title="Làm mới cuộc trò chuyện"
                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCloseWidget}
                title="Đóng cửa sổ chat (Esc)"
                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Banner cảnh báo mất kết nối mạng (Error State — Ngày 10-11) */}
          {isOffline && (
            <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-1.5 flex items-center gap-2 text-[11px] text-amber-800 shrink-0">
              <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Mất kết nối mạng — Hệ thống tự động dùng chế độ phản hồi dự phòng.
              </span>
            </div>
          )}

          {/* Panel Quản lý Session Chat (Guest Session Token & Lịch sử hội thoại) */}
          {showSessionPanel && (
            <div className="bg-slate-50 border-b border-gray-200 px-3.5 py-2.5 text-xs shrink-0 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-800">
                      Phiên hiện tại:
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isAuthenticated
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isAuthenticated ? 'User Session' : 'Guest Session'}
                    </span>
                  </div>
                  <p
                    className="text-[10px] text-gray-500 font-mono truncate mt-0.5"
                    title={activeSessionToken}
                  >
                    Token: {activeSessionToken}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetSession}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-primary hover:bg-primary/90 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Phiên mới</span>
                </button>
              </div>

              <div className="border-t border-gray-200/80 pt-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Lịch sử phiên đã lưu ({savedSessions.length})
                </p>
                {savedSessions.length === 0 ? (
                  <div className="py-3 px-2 text-center bg-white rounded-lg border border-dashed border-gray-200">
                    <MessageSquareDashed className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-[11px] font-medium text-gray-600">
                      Chưa có cuộc hội thoại nào
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Các cuộc trò chuyện của bạn sẽ tự động lưu tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5">
                    {savedSessions.map((sess) => {
                      const isCurrent =
                        sess.session_token === activeSessionToken;
                      return (
                        <div
                          key={sess.session_token}
                          onClick={() =>
                            handleSelectSession(sess.session_token)
                          }
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-blue-50/90 border-blue-200 text-primary'
                              : 'bg-white hover:bg-gray-100 border-gray-200/70 text-gray-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium truncate">
                              {sess.title || 'Cuộc trò chuyện'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {sess.message_count} tin nhắn •{' '}
                              {sess.is_guest ? 'Khách (Guest)' : 'Thành viên'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleDeleteSession(e, sess.session_token)
                            }
                            title="Xóa phiên này"
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Danh sách tin nhắn (Bubble Messages) */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScrollMessages}
            className="relative flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-gray-50 overscroll-y-contain"
          >
            {/* Loading State (Skeleton khi đang khôi phục lịch sử phiên chat — Ngày 10-11) */}
            {isLoadingHistory ? (
              <div className="space-y-3 py-2 animate-pulse">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Đang tải lịch sử cuộc trò chuyện...</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
                  <div className="h-14 w-3/4 bg-gray-200 rounded-2xl rounded-tl-xs" />
                </div>
                <div className="flex items-start gap-2 flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
                  <div className="h-10 w-1/2 bg-gray-200 rounded-2xl rounded-tr-xs" />
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isErrorMsg = Boolean(msg.hasError || msg.streamState === 'error');

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isUser
                          ? 'bg-primary text-white'
                          : isErrorMsg
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-primary'
                      }`}
                    >
                      {isUser ? (
                        <User className="w-4 h-4" />
                      ) : isErrorMsg ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>

                    {/* Nội dung Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-primary text-white rounded-tr-xs shadow-xs'
                          : isErrorMsg
                          ? 'bg-red-50/90 text-red-900 border border-red-200 rounded-tl-xs shadow-xs'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {/* Typing & Loading Indicator khi chờ chunk đầu tiên */}
                      {!isUser &&
                      msg.isStreaming &&
                      !msg.content &&
                      isWaitingFirstChunk ? (
                        <div className="flex items-center gap-2 py-1 px-0.5">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            AI đang xử lý...
                          </span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {isUser
                            ? msg.content
                            : renderFormattedText(msg.content, handleNavigateFromChat)}
                          {!isUser && msg.isStreaming && (
                            <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-primary animate-pulse" />
                          )}
                        </div>
                      )}

                      {/* Error State + Nút Thử gửi lại (Ngày 10-11) */}
                      {!isUser && isErrorMsg && msg.failedPrompt && (
                        <div className="mt-2 pt-2 border-t border-red-200/70 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-red-600 font-medium">
                            Gửi tin nhắn chưa thành công
                          </span>
                          <button
                            type="button"
                            disabled={isStreaming}
                            onClick={() => handleRetryMessage(msg)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Thử gửi lại</span>
                          </button>
                        </div>
                      )}

                      {/* Nhãn phân biệt khi nhận SSE Metadata (Product Cards / Comparison Table / Order Cards) */}
                      {!isUser && msg.metadata && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                          <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                            <Layers className="w-3 h-3" />
                            {msg.metadata.type === 'product_cards'
                              ? `Gợi ý sản phẩm (${msg.metadata.products.length})`
                              : msg.metadata.type === 'order_cards'
                              ? `Đơn hàng gần đây (${msg.metadata.orders.length})`
                              : 'Bảng so sánh thông số'}
                          </span>
                          <span>SSE Metadata</span>
                        </div>
                      )}

                      {/* Render Order Action Cards nếu metadata.type === 'order_cards' */}
                      {!isUser &&
                        msg.metadata?.type === 'order_cards' &&
                        msg.metadata.orders && (
                          <ChatOrderCardList
                            orders={msg.metadata.orders}
                            onNavigate={handleNavigateFromChat}
                          />
                        )}

                      {/* Render Product Action Cards nếu metadata.type === 'product_cards' */}
                      {!isUser &&
                        msg.metadata?.type === 'product_cards' &&
                        msg.metadata.products && (
                          <ChatProductCardList
                            products={msg.metadata.products}
                            onAddToCart={handleAddToCartFromCard}
                            onViewDetail={handleViewDetailFromCard}
                          />
                        )}

                      {/* Render Comparison Table nếu metadata.type === 'comparison_table' */}
                      {!isUser &&
                        msg.metadata?.type === 'comparison_table' && (
                          <ChatComparisonTable data={msg.metadata} />
                        )}

                      {/* Các nút tương tác ngữ cảnh E2E (Đăng nhập, Mở giỏ, Chi tiết đơn, Xác nhận hủy đơn 2 bước, Xem Ticket) */}
                      {!isUser && renderContextualActions(msg)}
                    </div>
                  </div>
                );
              })
            )}

            {/* Empty State ("Chưa có cuộc hội thoại nào") & Gợi ý câu hỏi nhanh — Ngày 10-11 */}
            {!isLoadingHistory && messages.length <= 1 && !isStreaming && (
              <div className="pt-1 space-y-3 animate-in fade-in duration-200">
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-3.5 text-center shadow-2xs">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-primary flex items-center justify-center mx-auto mb-1.5">
                    <MessageSquareDashed className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">
                    Chưa có cuộc hội thoại nào
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    Chọn nhanh một chủ đề bên dưới hoặc nhập câu hỏi để bắt đầu trò chuyện cùng Trợ lý AI.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Gợi ý câu hỏi nhanh:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="text-xs bg-white hover:bg-blue-50 active:scale-[0.98] text-gray-700 hover:text-primary border border-gray-200 hover:border-blue-200 rounded-full px-3 py-1.5 transition-all cursor-pointer text-left"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Nút nổi cuộn nhanh xuống tin nhắn mới nhất (Mobile & Hội thoại dài) */}
          {showScrollBottomBtn && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-16 right-4 z-20 inline-flex items-center gap-1 bg-white/95 hover:bg-white text-primary border border-gray-200 shadow-md rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer"
            >
              <ArrowDown className="w-3 h-3" />
              <span>Mới nhất</span>
            </button>
          )}

          {/* Gợi ý câu hỏi nhanh dạng cuộn ngang (Luôn sẵn sàng khi đang chat) */}
          {messages.length > 1 && !isStreaming && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-semibold text-gray-500 shrink-0 uppercase tracking-wider flex items-center gap-1 pl-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Gợi ý:
              </span>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 text-[11px] bg-white hover:bg-blue-50 active:scale-[0.97] text-gray-700 hover:text-primary border border-gray-200 hover:border-blue-200 rounded-full px-2.5 py-1 transition-all cursor-pointer whitespace-nowrap shadow-2xs font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Thanh nhập tin nhắn (Tối ưu chạm trên Mobile) */}
          <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder="Nhập câu hỏi hoặc sản phẩm cần tìm..."
                className="flex-1 bg-gray-100 focus:bg-white text-xs text-gray-900 rounded-xl px-3.5 py-2.5 border border-transparent focus:border-primary focus:outline-none transition-all disabled:opacity-60"
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStream}
                  title="Dừng trả lời"
                  className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  title="Gửi tin nhắn"
                  className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
