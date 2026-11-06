import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  User,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  ChatMessage,
  ChatMetadataPayload,
  ProductCardItem,
} from '@/types/aiChat';
import {
  clearStoredSession,
  fetchSessionHistory,
  getStoredSessionToken,
  loadMessagesFromLocalCache,
  saveMessagesToLocalCache,
  streamChatMessage,
} from '@/services/aiChatService';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import ChatProductCardList from './ChatProductCard';
import ChatComparisonTable from './ChatComparisonTable';

const QUICK_PROMPTS = [
  '📱 Tìm điện thoại chụp ảnh đẹp',
  '⚖️ So sánh iPhone 15 và Samsung S24',
  '🔄 Chính sách đổi trả hàng thế nào?',
  '🚚 Phí vận chuyển tính ra sao?',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content:
    'Xin chào! 👋 Mình là Trợ lý Mua sắm AI. Mình có thể giúp bạn tìm sản phẩm, so sánh cấu hình hoặc giải đáp chính sách đổi trả, bảo hành. Bạn đang quan tâm đến sản phẩm nào?',
  createdAt: new Date().toISOString(),
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingFirstChunk, setIsWaitingFirstChunk] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [forceMock, setForceMock] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();

  // Load lịch sử chat khi khởi tạo
  useEffect(() => {
    const token = getStoredSessionToken();
    if (!token) {
      const cached = loadMessagesFromLocalCache();
      if (cached.length > 0) setMessages(cached);
      return;
    }

    fetchSessionHistory(token).then((history) => {
      if (history.length > 0) {
        setMessages(history);
      }
    });
  }, []);

  // Lưu cache mỗi khi messages thay đổi
  useEffect(() => {
    if (messages.length > 1) {
      saveMessagesToLocalCache(messages);
    }
  }, [messages]);

  // Auto-scroll xuống cuối khi có tin nhắn hoặc chunk mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isWaitingFirstChunk, isOpen]);

  // Focus vào ô input khi mở cửa sổ chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleStopStream = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setIsWaitingFirstChunk(false);
  };

  const handleResetSession = () => {
    handleStopStream();
    clearStoredSession();
    setMessages([
      {
        ...WELCOME_MESSAGE,
        createdAt: new Date().toISOString(),
      },
    ]);
    toast.success('Đã tạo phiên trò chuyện mới');
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? inputValue).trim();
    if (!textToSend || isStreaming) return;

    if (!customText) {
      setInputValue('');
    }

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
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsStreaming(true);
    setIsWaitingFirstChunk(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await streamChatMessage(
      textToSend,
      {
        onModeChange: (mockFallback) => {
          setIsMockMode(mockFallback);
        },
        onTextChunk: (chunk: string) => {
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
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, isStreaming: false } : m
            )
          );
        },
        onError: (errMsg: string) => {
          setIsWaitingFirstChunk(false);
          setIsStreaming(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content:
                      m.content ||
                      `Xin lỗi, hệ thống đang bận (${errMsg}). Bạn vui lòng thử lại sau nhé!`,
                    isStreaming: false,
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

  const handleAddToCartFromCard = async (product: ProductCardItem) => {
    if (!isAuthenticated) {
      toast.error('Bạn vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng nhé!');
      handleSendMessage(`Thêm ${product.name} vào giỏ hàng giúp tôi`);
      return;
    }

    const isUuid =
      product.variant_id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        product.variant_id
      );

    if (isUuid && product.variant_id) {
      try {
        await addItem(product.id, product.variant_id, 1, {
          name: product.name,
          price: product.price,
          attributes: {},
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) góc phải dưới */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Mở Trợ lý Mua sắm AI"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-700 hover:to-primary text-white px-4 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-semibold hidden sm:inline">
            Trợ lý AI
          </span>
        </button>
      )}

      {/* Cửa sổ Chat (Fullscreen trên Mobile, Floating Window trên Desktop) */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full h-full sm:w-[400px] sm:h-[620px] sm:max-h-[calc(100vh-48px)] bg-white sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
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
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium cursor-pointer select-none ${
                      forceMock || isMockMode
                        ? 'bg-amber-400/90 text-gray-900'
                        : 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/30'
                    }`}
                  >
                    {forceMock || isMockMode ? 'Mock SSE' : 'Live SSE'}
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  Tư vấn sản phẩm & chính sách 24/7
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
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
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ chat"
                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Danh sách tin nhắn (Bubble Messages) */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-gray-50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isUser
                        ? 'bg-primary text-white'
                        : 'bg-blue-100 text-primary'
                    }`}
                  >
                    {isUser ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  {/* Nội dung Bubble */}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-primary text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {/* Typing Indicator khi chờ chunk đầu tiên */}
                    {!isUser &&
                    msg.isStreaming &&
                    !msg.content &&
                    isWaitingFirstChunk ? (
                      <div className="flex items-center gap-1 py-1 px-1">
                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {msg.content}
                        {!isUser && msg.isStreaming && (
                          <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-primary animate-pulse" />
                        )}
                      </div>
                    )}

                    {/* Render Product Action Cards nếu metadata.type === 'product_cards' */}
                    {!isUser &&
                      msg.metadata?.type === 'product_cards' &&
                      msg.metadata.products && (
                        <ChatProductCardList
                          products={msg.metadata.products}
                          onAddToCart={handleAddToCartFromCard}
                        />
                      )}

                    {/* Render Comparison Table nếu metadata.type === 'comparison_table' */}
                    {!isUser &&
                      msg.metadata?.type === 'comparison_table' && (
                        <ChatComparisonTable data={msg.metadata} />
                      )}
                  </div>
                </div>
              );
            })}

            {/* Gợi ý câu hỏi nhanh (hiển thị khi mới có 1 tin nhắn chào mừng) */}
            {messages.length === 1 && !isStreaming && (
              <div className="pt-2">
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
                      className="text-xs bg-white hover:bg-blue-50 text-gray-700 hover:text-primary border border-gray-200 hover:border-blue-200 rounded-full px-3 py-1.5 transition-colors cursor-pointer text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Thanh nhập tin nhắn */}
          <div className="p-3 bg-white border-t border-gray-200 shrink-0">
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
                  className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer shrink-0"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  title="Gửi tin nhắn"
                  className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:bg-gray-200 disabled:text-gray-400 transition-colors cursor-pointer shrink-0"
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
