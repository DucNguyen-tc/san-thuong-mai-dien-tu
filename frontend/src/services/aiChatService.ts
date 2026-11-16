import api from '@/lib/axios';
import { getProductBySlug, getProducts } from '@/services/productService';
import { getPrimaryImageUrl } from '@/types/catalog';
import type {
  ChatMessage,
  ChatMetadataPayload,
  ChatSessionSummary,
  ProductCardItem,
  SSEEventPacket,
  SSEStreamCallbacks,
} from '@/types/aiChat';

const AI_CHAT_API_URL = 'http://localhost:3000/api/ai/chat';
const AI_DIRECT_CHAT_URL = 'http://localhost:3010/api/ai/chat';
const AI_DIRECT_BASE_URL = 'http://localhost:3010/api/ai';
const SESSION_TOKEN_KEY = 'ai_chat_session_token';
const LOCAL_HISTORY_KEY = 'ai_chat_messages_cache';
const SESSION_MSG_PREFIX = 'ai_chat_session_msgs_';
const SESSIONS_INDEX_KEY = 'ai_chat_sessions_index';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Đọc thông tin user đã đăng nhập từ LocalStorage để đính kèm header xác thực
 */
function getAuthenticatedUserHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const rawUser = localStorage.getItem('user_data');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user?.id && typeof user.id === 'string') {
        headers['x-user-id'] = user.id;
      }
      if (user?.email && typeof user.email === 'string') {
        headers['x-user-email'] = user.email;
      }
    }
  } catch {
    // Ignore parse error
  }
  return headers;
}

/**
 * Kiểm tra trạng thái hoạt động của Backend AI Service (qua Gateway :3000 hoặc trực tiếp :3008)
 */
export async function checkAiBackendHealth(): Promise<boolean> {
  const endpoints = [
    'http://localhost:3010/health',
    'http://localhost:3000/health',
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return true;
    } catch {
      // Thử tiếp endpoint kế tiếp
    }
  }
  return false;
}

/**
 * Sinh chuỗi Guest Session Token chuẩn định dạng để lưu vào LocalStorage
 */
export function generateGuestSessionToken(): string {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `guest-${randomPart}`;
}

export function getStoredSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setStoredSessionToken(token: string): void {
  if (!token) return;
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

/**
 * Đảm bảo luôn có 1 session_token trong LocalStorage (cho cả Guest và User đã đăng nhập)
 */
export function getOrCreateSessionToken(): string {
  const existing = getStoredSessionToken();
  if (existing) return existing;
  const newToken = generateGuestSessionToken();
  setStoredSessionToken(newToken);
  return newToken;
}

/**
 * Tạo một phiên hội thoại mới hoàn toàn và trả về session_token mới
 */
export function createNewChatSession(): string {
  const newToken = generateGuestSessionToken();
  setStoredSessionToken(newToken);
  return newToken;
}

export function clearStoredSession(): void {
  const current = getStoredSessionToken();
  if (current) {
    localStorage.removeItem(`${SESSION_MSG_PREFIX}${current}`);
  }
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(LOCAL_HISTORY_KEY);
}

/**
 * Lấy danh sách các phiên chat đã lưu trong LocalStorage (tối đa 10 phiên gần nhất)
 */
export function getSavedSessionsList(): ChatSessionSummary[] {
  try {
    const raw = localStorage.getItem(SESSIONS_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatSessionSummary[]) : [];
  } catch {
    return [];
  }
}

/**
 * Xóa 1 phiên chat cụ thể khỏi danh sách lịch sử LocalStorage
 */
export function deleteStoredSession(sessionToken: string): ChatSessionSummary[] {
  try {
    localStorage.removeItem(`${SESSION_MSG_PREFIX}${sessionToken}`);
    const list = getSavedSessionsList().filter(
      (s) => s.session_token !== sessionToken
    );
    localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

/**
 * Lưu lịch sử tin nhắn của phiên hiện tại vào LocalStorage
 * và cập nhật chỉ mục các phiên hội thoại (Guest / User)
 */
export function saveMessagesToLocalCache(
  messages: ChatMessage[],
  sessionToken?: string
): void {
  try {
    const activeToken = sessionToken || getOrCreateSessionToken();
    const trimmed = messages.slice(-40);
    const serialized = JSON.stringify(trimmed);

    localStorage.setItem(LOCAL_HISTORY_KEY, serialized);
    localStorage.setItem(`${SESSION_MSG_PREFIX}${activeToken}`, serialized);

    // Chỉ cập nhật vào danh sách lịch sử khi có ít nhất 1 tin nhắn từ người dùng
    const firstUserMsg = trimmed.find((m) => m.role === 'user');
    if (firstUserMsg) {
      const isGuest = !localStorage.getItem('access_token');
      const currentList = getSavedSessionsList();
      const summary: ChatSessionSummary = {
        session_token: activeToken,
        title: firstUserMsg.content.slice(0, 48),
        is_guest: isGuest,
        updated_at: new Date().toISOString(),
        message_count: trimmed.length,
      };

      const filtered = currentList.filter(
        (item) => item.session_token !== activeToken
      );
      const updatedList = [summary, ...filtered].slice(0, 10);
      localStorage.setItem(SESSIONS_INDEX_KEY, JSON.stringify(updatedList));
    }
  } catch {
    // Bỏ qua lỗi tràn bộ nhớ LocalStorage
  }
}

/**
 * Đọc lịch sử tin nhắn từ LocalStorage theo sessionToken (hoặc bộ đệm gần nhất)
 */
export function loadMessagesFromLocalCache(sessionToken?: string): ChatMessage[] {
  try {
    const token = sessionToken || getStoredSessionToken();
    if (token) {
      const bySession = localStorage.getItem(`${SESSION_MSG_PREFIX}${token}`);
      if (bySession) {
        return JSON.parse(bySession) as ChatMessage[];
      }
    }

    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

/**
 * Lấy lịch sử hội thoại từ Backend (GET /api/ai/sessions/:sessionToken/messages)
 * Nếu Backend chưa bật, DB đang ở chế độ in-memory (trả về mảng rỗng) hoặc 404
 * thì tự động khôi phục từ LocalStorage của đúng sessionToken đó.
 */
export async function fetchSessionHistory(
  sessionToken: string
): Promise<ChatMessage[]> {
  try {
    const res = await api.get(`/ai/sessions/${sessionToken}/messages`);
    const backendMessages = res.data?.data?.messages;
    if (Array.isArray(backendMessages) && backendMessages.length > 0) {
      const normalized: ChatMessage[] = backendMessages.map((m: any) => ({
        id: String(m.id),
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || '',
        metadata: m.metadata || null,
        createdAt: m.createdAt || m.created_at || new Date().toISOString(),
      }));
      saveMessagesToLocalCache(normalized, sessionToken);
      return normalized;
    }
  } catch {
    // Nếu Gateway :3000 chưa bật, thử gọi trực tiếp ai-service :3008
    try {
      const directRes = await fetch(
        `${AI_DIRECT_BASE_URL}/sessions/${sessionToken}/messages`
      );
      if (directRes.ok) {
        const json = await directRes.json();
        const backendMessages = json?.data?.messages;
        if (Array.isArray(backendMessages) && backendMessages.length > 0) {
          const normalized: ChatMessage[] = backendMessages.map((m: any) => ({
            id: String(m.id),
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content || '',
            metadata: m.metadata || null,
            createdAt: m.createdAt || m.created_at || new Date().toISOString(),
          }));
          saveMessagesToLocalCache(normalized, sessionToken);
          return normalized;
        }
      }
    } catch {
      // Fallback về LocalStorage khi cả 2 cổng đều offline
    }
  }
  return loadMessagesFromLocalCache(sessionToken);
}

/**
 * Phân tích & điều phối gói tin SSE theo đúng Message Type:
 * - session    -> lưu session_token
 * - text_chunk -> nối từng cụm văn bản vào bubble đang stream
 * - metadata   -> render Product Action Cards / Comparison Table
 * - done       -> hoàn tất luồng SSE
 * - error      -> báo lỗi
 */
export function dispatchSSEPacket(
  eventName: string,
  rawData: string,
  callbacks: SSEStreamCallbacks
): void {
  if (!rawData) return;

  try {
    const parsed = JSON.parse(rawData) as SSEEventPacket;

    if (eventName === 'session' || (parsed.session_token && !parsed.type)) {
      if (parsed.session_token) {
        setStoredSessionToken(parsed.session_token);
        callbacks.onSession?.({
          session_id: parsed.session_id || parsed.session_token,
          session_token: parsed.session_token,
        });
      }
      return;
    }

    if (eventName === 'error' || parsed.type === 'error') {
      callbacks.onStateChange?.('error');
      callbacks.onError?.(parsed.message || 'Có lỗi xảy ra khi xử lý tin nhắn');
      return;
    }

    if (eventName === 'done' || parsed.type === 'done') {
      callbacks.onStateChange?.('done');
      callbacks.onDone?.();
      return;
    }

    if (parsed.type === 'text_chunk' && typeof parsed.content === 'string') {
      callbacks.onStateChange?.('streaming_text');
      callbacks.onTextChunk(parsed.content);
      return;
    }

    if (parsed.type === 'metadata' && parsed.payload) {
      callbacks.onStateChange?.('receiving_metadata');
      callbacks.onMetadata?.(parsed.payload);
      return;
    }
  } catch {
    // Bỏ qua nếu dòng data không phải JSON hợp lệ
  }
}

/**
 * Tích hợp chuẩn Browser EventSource API (Ngày 4-5)
 * Dùng cho các luồng GET SSE hoặc lắng nghe stream sự kiện theo URL
 */
export function connectEventSourceStream(
  streamUrl: string,
  callbacks: SSEStreamCallbacks
): () => void {
  callbacks.onStateChange?.('connecting');
  const eventSource = new EventSource(streamUrl);

  eventSource.addEventListener('session', (event) => {
    const msgEvent = event as MessageEvent<string>;
    dispatchSSEPacket('session', msgEvent.data, callbacks);
  });

  eventSource.addEventListener('message', (event) => {
    const msgEvent = event as MessageEvent<string>;
    dispatchSSEPacket('message', msgEvent.data, callbacks);
  });

  eventSource.addEventListener('done', (event) => {
    const msgEvent = event as MessageEvent<string>;
    dispatchSSEPacket('done', msgEvent.data, callbacks);
    eventSource.close();
  });

  eventSource.onerror = () => {
    callbacks.onStateChange?.('error');
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}

/**
 * Đồng bộ dữ liệu Product Card với catalog-service thật (nếu đang chạy)
 * Giúp nút "Xem chi tiết" (/product/:slug) và "Thêm giỏ" (variant_id thật) hoạt động chuẩn E2E
 */
async function resolveCatalogProductCards(
  queryText: string,
  fallbackCards: ProductCardItem[]
): Promise<ProductCardItem[]> {
  try {
    const lower = queryText.toLowerCase();
    let searchKeyword = '';
    if (lower.includes('iphone')) searchKeyword = 'iPhone';
    else if (lower.includes('samsung')) searchKeyword = 'Samsung';
    else if (lower.includes('laptop') || lower.includes('macbook')) searchKeyword = 'MacBook';
    else if (lower.includes('tai nghe') || lower.includes('airpods') || lower.includes('sony'))
      searchKeyword = 'Tai nghe';
    else if (lower.includes('đồng hồ') || lower.includes('watch')) searchKeyword = 'Watch';
    else if (lower.includes('điện thoại')) searchKeyword = 'iPhone';

    const result = await getProducts({
      search: searchKeyword || undefined,
      limit: 3,
    });

    if (result.items && result.items.length > 0) {
      return result.items.slice(0, 3).map((p) => {
        const activeVariant =
          p.variants?.find((v) => v.is_active && v.stock_quantity > 0) ||
          p.variants?.[0];
        const primaryImg = getPrimaryImageUrl(p);
        const price = activeVariant ? Number(activeVariant.price) : 0;
        const originalPrice = price > 0 ? Math.round((price * 1.1) / 10000) * 10000 : undefined;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          image_url: primaryImg,
          price,
          original_price: originalPrice,
          discount_percent: originalPrice ? 9 : undefined,
          category: p.category?.name || 'Sản phẩm',
          in_stock: activeVariant ? activeVariant.stock_quantity > 0 : true,
          variant_id: activeVariant?.id,
        };
      });
    }
  } catch {
    // Nếu catalog-service không bật, giữ nguyên danh sách fallbackCards
  }
  return fallbackCards;
}

/**
 * Chuẩn hóa metadata từ Backend ai-service:
 * Nếu Backend trả về mock slug/variant_id (ví dụ "iphone-15-pro-max-256gb"),
 * tự động tra cứu sản phẩm tương ứng trong catalog-service để lấy slug & variant_id thật.
 */
async function enrichMetadataPayload(
  payload: ChatMetadataPayload,
  userQuery: string
): Promise<ChatMetadataPayload> {
  if (payload.type !== 'product_cards' || !Array.isArray(payload.products)) {
    return payload;
  }

  const hasMockIds = payload.products.some(
    (item) => !item.variant_id || !UUID_REGEX.test(item.variant_id)
  );

  if (!hasMockIds) {
    return payload;
  }

  const enrichedProducts = await Promise.all(
    payload.products.map(async (item) => {
      if (item.variant_id && UUID_REGEX.test(item.variant_id)) {
        return item;
      }
      const realProduct = await getProductBySlug(item.slug || item.name);
      if (!realProduct) return item;

      const activeVariant =
        realProduct.variants?.find((v) => v.is_active && v.stock_quantity > 0) ||
        realProduct.variants?.[0];
      const primaryImg = getPrimaryImageUrl(realProduct) || item.image_url;

      return {
        ...item,
        id: realProduct.id,
        name: realProduct.name,
        slug: realProduct.slug,
        image_url: primaryImg,
        price: activeVariant ? Number(activeVariant.price) : item.price,
        category: realProduct.category?.name || item.category,
        in_stock: activeVariant ? activeVariant.stock_quantity > 0 : item.in_stock,
        variant_id: activeVariant?.id || item.variant_id,
      };
    })
  );

  // Nếu vẫn còn item chưa khớp DB và user đang tìm sản phẩm, thử lấy từ catalog-service
  const stillAllMock = enrichedProducts.every(
    (item) => !item.variant_id || !UUID_REGEX.test(item.variant_id)
  );
  if (stillAllMock) {
    const resolved = await resolveCatalogProductCards(userQuery, enrichedProducts);
    return {
      ...payload,
      products: resolved,
    };
  }

  return {
    ...payload,
    products: enrichedProducts,
  };
}

/**
 * Mock SSE Generator (Phục vụ test độc lập trên Frontend hoặc khi Backend tắt)
 * Giả lập đúng định dạng SSE Contract đã chốt với Bạn 1 (Dự):
 * - event: session -> { session_id, session_token }
 * - event: message -> { type: 'text_chunk', content }
 * - event: message -> { type: 'metadata', payload }
 * - event: done    -> { type: 'done' }
 */
async function simulateMockSSEStream(
  message: string,
  callbacks: SSEStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  callbacks.onModeChange?.(true);
  callbacks.onStateChange?.('connecting');

  const existingToken = getOrCreateSessionToken();

  callbacks.onSession?.({
    session_id: existingToken,
    session_token: existingToken,
  });

  const lower = message.toLowerCase();
  const isComparison =
    lower.includes('so sánh') ||
    lower.includes('khác nhau') ||
    lower.includes('nên mua');
  const isProductQuery =
    isComparison ||
    [
      'tìm',
      'sản phẩm',
      'mua',
      'giá',
      'điện thoại',
      'laptop',
      'iphone',
      'samsung',
      'tai nghe',
      'đồng hồ',
      'tư vấn',
    ].some((kw) => lower.includes(kw));
  const isPolicyQuery = [
    'đổi trả',
    'bảo hành',
    'vận chuyển',
    'ship',
    'hoàn tiền',
    'thanh toán',
    'chính sách',
  ].some((kw) => lower.includes(kw));

  let replyText =
    'Xin chào! Mình là **Trợ lý Mua sắm AI** của sàn. Mình có thể giúp bạn:\n• Tìm kiếm sản phẩm theo nhu cầu và tầm giá\n• So sánh cấu hình chi tiết giữa các sản phẩm (2-4 mẫu)\n• Giải đáp chính sách đổi trả, bảo hành, vận chuyển 24/7!';
  let metadataPayload: ChatMetadataPayload | null = null;

  if (isComparison) {
    const wantsThreeProducts =
      lower.includes('3') ||
      lower.includes('xiaomi') ||
      lower.includes('oppo') ||
      lower.includes('pixel');

    if (wantsThreeProducts) {
      replyText =
        'Dưới đây là bảng so sánh chi tiết 3 mẫu flagship **iPhone 15 Pro Max**, **Samsung Galaxy S24 Ultra** và **Xiaomi 14 Ultra** kèm đánh giá ưu/nhược điểm từng máy:';
      metadataPayload = {
        type: 'comparison_table',
        products: [
          'iPhone 15 Pro Max 256GB',
          'Samsung Galaxy S24 Ultra 5G',
          'Xiaomi 14 Ultra 5G 512GB',
        ],
        attributes: [
          { name: 'Giá bán', values: ['28.990.000đ', '27.990.000đ', '26.990.000đ'] },
          {
            name: 'Vi xử lý (Chip)',
            values: [
              'Apple A17 Pro (3nm)',
              'Snapdragon 8 Gen 3 for Galaxy',
              'Snapdragon 8 Gen 3',
            ],
          },
          {
            name: 'Màn hình',
            values: [
              '6.7" OLED 120Hz ProMotion',
              '6.8" Dynamic AMOLED 2X 120Hz',
              '6.73" LTPO AMOLED 120Hz 3000 nits',
            ],
          },
          { name: 'RAM / Bộ nhớ', values: ['8GB / 256GB', '12GB / 256GB', '16GB / 512GB'] },
          {
            name: 'Camera chính',
            values: [
              '48MP + 12MP + 12MP Zoom 5x',
              '200MP + 50MP + 10MP + 12MP',
              '4x 50MP Leica Summilux cảm biến 1 inch',
            ],
          },
          {
            name: 'Dung lượng Pin',
            values: ['4422 mAh (Sạc 27W)', '5000 mAh (Sạc 45W)', '5000 mAh (Sạc 90W)'],
          },
        ],
        highlights: [
          {
            product: 'iPhone 15 Pro Max 256GB',
            pros: [
              'Quay video ProRes/Log chống rung tốt nhất phân khúc',
              'Hệ sinh thái iOS mượt mà, giữ giá lâu dài',
            ],
            cons: ['Tốc độ sạc 27W chậm hơn đối thủ Android', 'RAM 8GB thấp hơn'],
          },
          {
            product: 'Samsung Galaxy S24 Ultra 5G',
            pros: [
              'Màn hình phẳng chống chói Gorilla Armor độc quyền',
              'Tích hợp bút S-Pen & bộ công cụ Galaxy AI tiếng Việt',
            ],
            cons: ['Thiết kế vuông vức hơi cấn tay khi cầm lâu'],
          },
          {
            product: 'Xiaomi 14 Ultra 5G 512GB',
            pros: [
              'Giá tốt nhất (26.990.000đ) kèm bộ nhớ khủng 16GB/512GB',
              'Cụm 4 camera Leica cảm biến 1 inch & sạc siêu nhanh 90W',
            ],
            cons: ['Cụm camera sau khá dày và nặng ở phần trên'],
          },
        ],
        recommendation:
          'Chọn **iPhone 15 Pro Max** nếu bạn ưu tiên quay video và sự ổn định lâu dài; chọn **Samsung Galaxy S24 Ultra** nếu cần làm việc đa nhiệm với S-Pen & AI; hoặc chọn **Xiaomi 14 Ultra** nếu đam mê nhiếp ảnh Leica và sạc nhanh 90W.',
      };
    } else {
      replyText =
        'Dưới đây là bảng so sánh chi tiết giữa **iPhone 15 Pro Max** và **Samsung Galaxy S24 Ultra** dựa trên thông số kỹ thuật thực tế tại sàn để bạn dễ dàng lựa chọn:';
      metadataPayload = {
        type: 'comparison_table',
        products: ['iPhone 15 Pro Max 256GB', 'Samsung Galaxy S24 Ultra 5G'],
        attributes: [
          { name: 'Giá bán', values: ['28.990.000đ', '27.990.000đ'] },
          { name: 'Vi xử lý (Chip)', values: ['Apple A17 Pro (3nm)', 'Snapdragon 8 Gen 3 for Galaxy'] },
          { name: 'Màn hình', values: ['6.7" OLED 120Hz ProMotion', '6.8" Dynamic AMOLED 2X 120Hz'] },
          { name: 'RAM / Bộ nhớ', values: ['8GB / 256GB', '12GB / 256GB'] },
          { name: 'Camera chính', values: ['48MP + 12MP + 12MP Zoom 5x', '200MP + 50MP + 10MP + 12MP'] },
          { name: 'Dung lượng Pin', values: ['4422 mAh (Sạc 27W)', '5000 mAh (Sạc 45W)'] },
        ],
        highlights: [
          {
            product: 'iPhone 15 Pro Max 256GB',
            pros: [
              'Hiệu năng chip A17 Pro (3nm) tối ưu game & quay video 4K ProRes',
              'Khung viền Titanium bo cong cầm nắm thoải mái, giữ giá tốt',
            ],
            cons: ['Công suất sạc 27W và dung lượng RAM 8GB thấp hơn đối thủ'],
          },
          {
            product: 'Samsung Galaxy S24 Ultra 5G',
            pros: [
              'Giá tốt hơn (27.990.000đ), RAM 12GB, Pin 5000mAh sạc nhanh 45W',
              'Camera 200MP zoom xa sắc nét, màn hình chống lóa & có bút S-Pen',
            ],
            cons: ['Kiểu dáng vuông vức kích thước lớn'],
          },
        ],
        recommendation:
          '**Samsung Galaxy S24 Ultra** vượt trội nếu bạn cần màn hình chống chói, RAM 12GB, pin 5000mAh và bút S-Pen. Trong khi đó **iPhone 15 Pro Max** tối ưu cho quay video chuyên nghiệp và sự ổn định lâu dài của iOS.',
      };
    }
  } else if (
    lower.includes('xác nhận hủy đơn') ||
    lower.includes('đồng ý hủy đơn')
  ) {
    const isLoggedIn = Boolean(localStorage.getItem('access_token'));
    const match = lower.match(/(?:hủy đơn|đơn hàng|mã đơn)\s*(?:#)?([a-zA-Z0-9_-]+)/);
    const orderId = match ? match[1].toUpperCase() : 'ORD-2026-8899';
    replyText = isLoggedIn
      ? `✅ **HỦY ĐƠN HÀNG THÀNH CÔNG!**\n\nĐơn hàng **#${orderId}** của bạn đã được chuyển sang trạng thái **Đã Hủy**. Tồn kho sản phẩm đã được hoàn trả và tiền thanh toán (nếu có) sẽ hoàn về tài khoản trong 24 - 48 giờ làm việc.`
      : '🔒 Bạn vui lòng đăng nhập tài khoản để thực hiện thao tác hủy đơn hàng!';
  } else if (lower.includes('hủy đơn') || lower.includes('cancel đơn')) {
    const isLoggedIn = Boolean(localStorage.getItem('access_token'));
    const match = lower.match(/(?:hủy đơn|đơn hàng|mã đơn)\s*(?:#)?([a-zA-Z0-9_-]+)/);
    const orderId = match ? match[1].toUpperCase() : 'ORD-2026-8899';
    replyText = isLoggedIn
      ? `⚠️ **XÁC NHẬN HỦY ĐƠN HÀNG #${orderId}**\n\nBạn có chắc chắn muốn hủy đơn hàng này không? Lưu ý rằng sau khi hủy:\n• Đơn hàng sẽ không thể khôi phục lại.\n• Nếu đã thanh toán trực tuyến, tiền sẽ được hoàn trả về tài khoản gốc trong 1-3 ngày làm việc.\n\n👉 Nếu bạn hoàn toàn chắc chắn, hãy bấm nút xác nhận bên dưới hoặc nhắn lại: **"Xác nhận hủy đơn ${orderId}"** để tôi tiến hành hủy ngay giúp bạn nhé!`
      : '🔒 Bạn vui lòng đăng nhập tài khoản để thực hiện thao tác hủy đơn hàng!';
  } else if (
    lower.includes('chi tiết đơn') ||
    (lower.includes('đơn hàng') && (lower.includes('#') || lower.includes('ord-')))
  ) {
    const isLoggedIn = Boolean(localStorage.getItem('access_token'));
    const match = lower.match(/(?:đơn hàng|mã đơn|chi tiết đơn)\s*(?:#)?([a-zA-Z0-9_-]+)/);
    const orderId = match ? match[1].toUpperCase() : 'ORD-2026-8899';
    replyText = isLoggedIn
      ? `📋 **Chi tiết đơn hàng #${orderId}:**\n• **Trạng thái:** 🚚 **Đang giao hàng** (Đơn vị vận chuyển: GHN Express)\n• **Sản phẩm:** 1x iPhone 15 Pro Max 256GB - Màu Titan Tự Nhiên\n• **Tổng thanh toán:** **28.990.000đ** (Đã thanh toán trực tuyến)\n• **Thời gian giao dự kiến:** Trong vòng 24h tới.`
      : '🔒 Bạn vui lòng đăng nhập tài khoản để xem chi tiết đơn hàng nhé!';
  } else if (
    lower.includes('đơn hàng của tôi') ||
    lower.includes('kiểm tra đơn') ||
    lower.includes('xem đơn hàng') ||
    lower.includes('lịch sử mua') ||
    lower.includes('đơn mua')
  ) {
    const isLoggedIn = Boolean(localStorage.getItem('access_token'));
    replyText = isLoggedIn
      ? `📦 **Đơn hàng gần đây của bạn:**\n\n1. **Mã đơn: #ORD-2026-8899**\n   • Trạng thái: 🚚 **Đang vận chuyển** (Dự kiến giao ngày mai)\n   • Sản phẩm: 1x iPhone 15 Pro Max 256GB\n   • Tổng thanh toán: **28.990.000đ** (Đã thanh toán qua VNPay)\n\n👉 Bạn có thể bấm nút bên dưới hoặc nhắn *"Xem chi tiết đơn ORD-2026-8899"* để kiểm tra hành trình vận chuyển nhé!`
      : '🔒 Bạn vui lòng đăng nhập tài khoản để tra cứu lịch sử đơn hàng của mình nhé!';
  } else if (
    lower.includes('thêm vào giỏ') ||
    lower.includes('thêm sản phẩm') ||
    lower.includes('thêm giỏ hàng') ||
    lower.includes('cho vào giỏ')
  ) {
    const isLoggedIn = Boolean(localStorage.getItem('access_token'));
    replyText = isLoggedIn
      ? `🛒 Đã thêm thành công sản phẩm vào giỏ hàng của bạn! (Số lượng: 1). Bạn có thể nhấn vào nút **Xem giỏ hàng** bên dưới hoặc bảo tôi kiểm tra giỏ hàng bất kỳ lúc nào nhé!`
      : '🔒 Bạn vui lòng đăng nhập tài khoản để có thể thêm sản phẩm vào giỏ hàng và lưu trữ nhé!';
  } else if (
    lower.includes('xem giỏ') ||
    lower.includes('giỏ hàng của tôi') ||
    lower.includes('kiểm tra giỏ')
  ) {
    const isLoggedIn = Boolean(localStorage.getItem('access_token'));
    replyText = isLoggedIn
      ? `🛒 **Giỏ hàng hiện tại của bạn:**\n\n1. **iPhone 15 Pro Max 256GB Chính Hãng VNA**\n   • Số lượng: **1** x 28.990.000đ = **28.990.000đ**\n\n💰 **Tổng giá trị tạm tính:** **28.990.000đ**\nBạn có muốn đặt hàng hoặc áp dụng mã giảm giá không?`
      : '🔒 Bạn vui lòng đăng nhập tài khoản để xem các sản phẩm trong giỏ hàng của mình nhé!';
  } else if (
    lower.includes('khiếu nại') ||
    lower.includes('gặp nhân viên') ||
    lower.includes('gặp người thật') ||
    lower.includes('bức xúc')
  ) {
    const ticketCode = `TK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-015`;
    replyText = `Em rất tiếc về trải nghiệm chưa tốt này của bạn ạ! 🙏\n\nEm đã tạo phiếu yêu cầu hỗ trợ khẩn cấp (Mã ticket: **${ticketCode}**) và chuyển tiếp toàn bộ vấn đề của bạn sang cho đội ngũ CSKH con người.\n\nNhân viên CSKH chuyên trách sẽ kiểm tra và phản hồi lại qua email trong thời gian sớm nhất ạ!`;
  } else if (isProductQuery) {
    replyText =
      'Mình tìm thấy các mẫu sản phẩm nổi bật phù hợp với nhu cầu của bạn. Bạn có thể bấm **"Xem chi tiết"** để mở trang sản phẩm hoặc bấm **"Thêm giỏ"** ngay trên thẻ bên dưới nhé:';
    const defaultCards: ProductCardItem[] = [
      {
        id: '44125e28-653e-4724-96d0-3dd405e85992',
        name: 'Apple iPhone 16 Pro Max 256GB Chính Hãng',
        slug: 'apple-iphone-16-pro-max-256gb-cat500-1',
        image_url:
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
        price: 34990000,
        original_price: 37990000,
        discount_percent: 8,
        category: 'Điện thoại',
        in_stock: true,
        variant_id: 'var-ip16pm-256',
      },
      {
        id: 'b1697090-9097-460f-bd4b-286f3a961282',
        name: 'Samsung Galaxy S24 Ultra 5G 256GB',
        slug: 'samsung-galaxy-s24-ultra-5g-256gb-cat500-11',
        image_url:
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80',
        price: 29990000,
        original_price: 33990000,
        discount_percent: 12,
        category: 'Điện thoại',
        in_stock: true,
        variant_id: 'var-s24u-256',
      },
    ];
    const resolvedCards = await resolveCatalogProductCards(message, defaultCards);
    metadataPayload = {
      type: 'product_cards',
      products: resolvedCards,
    };
  } else if (isPolicyQuery) {
    replyText =
      'Theo **chính sách hiện hành của sàn**:\n• **Đổi trả:** Miễn phí trong vòng 7 ngày nếu sản phẩm có lỗi từ nhà sản xuất.\n• **Bảo hành:** Chính hãng 12 - 24 tháng tại hệ thống trung tâm ủy quyền toàn quốc.\n• **Vận chuyển:** Miễn phí giao hàng toàn quốc cho đơn từ 500.000đ (giao nhanh nội thành 1-2 ngày).';
  }

  // Stream từng cụm từ để tái hiện hiệu ứng chữ chạy (SSE text_chunk)
  callbacks.onStateChange?.('streaming_text');
  const words = replyText.split(' ');
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
    const chunk = (i === 0 ? '' : ' ') + words[i];
    callbacks.onTextChunk(chunk);
  }

  if (metadataPayload && !signal?.aborted) {
    callbacks.onStateChange?.('receiving_metadata');
    await new Promise((resolve) => setTimeout(resolve, 120));
    callbacks.onMetadata?.(metadataPayload);
  }

  if (!signal?.aborted) {
    callbacks.onStateChange?.('done');
    callbacks.onDone?.();
  }
}

/**
 * Kết nối SSE Streaming tới POST /api/ai/chat (Tích hợp thật Ngày 8-9 với Bạn 1)
 * - Ưu tiên gọi qua API Gateway (http://localhost:3000/api/ai/chat)
 * - Nếu API Gateway chưa bật, tự động kết nối trực tiếp tới ai-service (http://localhost:3008/api/ai/chat)
 * - Hỗ trợ gửi kèm JWT Authorization & x-user-id để thực thi Cart Tools, Order Tools, Escalate Ticket
 */
export async function streamChatMessage(
  message: string,
  callbacks: SSEStreamCallbacks,
  options?: { signal?: AbortSignal; forceMock?: boolean }
): Promise<void> {
  if (options?.forceMock) {
    await simulateMockSSEStream(message, callbacks, options.signal);
    return;
  }

  const sessionToken = getOrCreateSessionToken();
  const authHeaders = getAuthenticatedUserHeaders();

  callbacks.onStateChange?.('connecting');

  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...authHeaders,
    },
    body: JSON.stringify({
      message,
      session_token: sessionToken || undefined,
    }),
    signal: options?.signal,
  };

  try {
    let response: Response | null = null;

    // 1. Thử gọi qua API Gateway (:3000) trước
    try {
      const gatewayRes = await fetch(AI_CHAT_API_URL, requestInit);
      if (gatewayRes.ok && gatewayRes.body) {
        response = gatewayRes;
      }
    } catch (gwErr: any) {
      if (gwErr?.name === 'AbortError') return;
    }

    // 2. Nếu Gateway chưa bật hoặc trả lỗi 502/504, gọi trực tiếp tới ai-service (:3008)
    if (!response) {
      const directRes = await fetch(AI_DIRECT_CHAT_URL, requestInit);
      if (!directRes.ok || !directRes.body) {
        throw new Error(`HTTP ${directRes.status}`);
      }
      response = directRes;
    }

    callbacks.onModeChange?.(false);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = 'message';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          currentEvent = 'message';
          continue;
        }

        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
          continue;
        }

        if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim();
          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr) as SSEEventPacket;
            if (parsed.type === 'metadata' && parsed.payload) {
              callbacks.onStateChange?.('receiving_metadata');
              const enriched = await enrichMetadataPayload(parsed.payload, message);
              callbacks.onMetadata?.(enriched);
            } else {
              dispatchSSEPacket(currentEvent, dataStr, callbacks);
            }
          } catch {
            // Bỏ qua dòng không hợp lệ
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') return;
    // Tự động chuyển sang Mock SSE khi Backend ai-service chưa bật để không bị gián đoạn demo/UI
    await simulateMockSSEStream(message, callbacks, options?.signal);
  }
}
