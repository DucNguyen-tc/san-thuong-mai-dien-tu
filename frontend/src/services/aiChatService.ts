import api from '@/lib/axios';
import { getProductBySlug, getProducts } from '@/services/productService';
import { getPrimaryImageUrl } from '@/types/catalog';
import type {
  ChatMessage,
  ChatMetadataPayload,
  ProductCardItem,
  SSEEventPacket,
  SSEStreamCallbacks,
} from '@/types/aiChat';

const AI_CHAT_API_URL = 'http://localhost:3000/api/ai/chat';
const SESSION_TOKEN_KEY = 'ai_chat_session_token';
const LOCAL_HISTORY_KEY = 'ai_chat_messages_cache';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getStoredSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setStoredSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(LOCAL_HISTORY_KEY);
}

export function saveMessagesToLocalCache(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(messages.slice(-30)));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadMessagesFromLocalCache(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

/**
 * Lấy lịch sử hội thoại từ Backend (GET /api/ai/sessions/:sessionToken/messages)
 * Nếu Backend chưa bật hoặc 404 thì fallback về LocalStorage cache
 */
export async function fetchSessionHistory(sessionToken: string): Promise<ChatMessage[]> {
  try {
    const res = await api.get(`/ai/sessions/${sessionToken}/messages`);
    const backendMessages = res.data?.data?.messages;
    if (Array.isArray(backendMessages) && backendMessages.length > 0) {
      return backendMessages.map((m: any) => ({
        id: String(m.id),
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || '',
        metadata: m.metadata || null,
        createdAt: m.createdAt || m.created_at || new Date().toISOString(),
      }));
    }
  } catch {
    // Fallback to local cache when backend session is not found or offline
  }
  return loadMessagesFromLocalCache();
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

  const existingToken = getStoredSessionToken() || `mock-session-${Date.now()}`;
  setStoredSessionToken(existingToken);

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
    'Xin chào! Mình là **Trợ lý Mua sắm AI** của sàn. Mình có thể giúp bạn:\n• Tìm kiếm sản phẩm theo nhu cầu và tầm giá\n• So sánh cấu hình chi tiết giữa các sản phẩm\n• Giải đáp chính sách đổi trả, bảo hành, vận chuyển 24/7!';
  let metadataPayload: ChatMetadataPayload | null = null;

  if (isComparison) {
    replyText =
      'Dưới đây là bảng so sánh chi tiết giữa **iPhone 15 Pro Max** và **Samsung Galaxy S24 Ultra** dựa trên thông số kỹ thuật thực tế tại sàn để bạn dễ dàng lựa chọn:';
    metadataPayload = {
      type: 'comparison_table',
      products: ['iPhone 15 Pro Max 256GB', 'Samsung Galaxy S24 Ultra 5G'],
      attributes: [
        { name: 'Giá bán', values: ['28.990.000đ', '29.990.000đ'] },
        { name: 'Vi xử lý (Chip)', values: ['Apple A17 Pro (3nm)', 'Snapdragon 8 Gen 3 for Galaxy'] },
        { name: 'Màn hình', values: ['6.7" OLED 120Hz ProMotion', '6.8" Dynamic AMOLED 2X 120Hz'] },
        { name: 'RAM / Bộ nhớ', values: ['8GB / 256GB', '12GB / 256GB'] },
        { name: 'Camera chính', values: ['48MP + 12MP + 12MP Zoom 5x', '200MP + 50MP + 10MP + 12MP'] },
        { name: 'Dung lượng Pin', values: ['4422 mAh (Sạc 27W)', '5000 mAh (Sạc 45W)'] },
      ],
      recommendation:
        'Samsung Galaxy S24 Ultra vượt trội nếu bạn cần màn hình chống chói, RAM 12GB, pin 5000mAh và bút S-Pen. Trong khi đó iPhone 15 Pro Max tối ưu cho quay video chuyên nghiệp và sự ổn định lâu dài của iOS.',
    };
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
 * Kết nối SSE Streaming tới POST /api/ai/chat
 * Hỗ trợ đọc từng dòng event: / data: theo chuẩn Server-Sent Events
 * và phân biệt rõ message type: text_chunk vs metadata
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

  const accessToken = localStorage.getItem('access_token');
  const sessionToken = getStoredSessionToken();

  callbacks.onStateChange?.('connecting');

  try {
    const response = await fetch(AI_CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        message,
        session_token: sessionToken || undefined,
      }),
      signal: options?.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    callbacks.onModeChange?.(false);

    const reader = response.body.getReader();
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
