import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env';
import { RagChunkResult } from './rag.service';
import { catalogTool, ToolMetadataPayload, ToolExecutionResult } from '../tools/catalog.tool';
import { cartTool } from '../tools/cart.tool';
import { orderTool } from '../tools/order.tool';
import { promotionTool } from '../tools/promotion.tool';
import { ticketTool } from '../tools/ticket.tool';

export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OrchestratorStreamOptions {
  messages: ChatMessageParam[];
  contextChunks: RagChunkResult[];
  customerId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  sessionId?: string | null;
  onChunk: (chunk: string) => void;
  onMetadata?: (metadata: ToolMetadataPayload) => void;
}

export interface OrchestratorResult {
  fullText: string;
  metadata?: ToolMetadataPayload | null;
  toolCalls?: Array<{ name: string; args: any; result: any }>;
}

export class LlmOrchestrator {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    if (env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  /**
   * Tạo System Prompt chuẩn chỉnh theo Mục 4.3 trong tài liệu kiến trúc
   */
  private buildSystemPrompt(contextChunks: RagChunkResult[]): string {
    let basePrompt = `Bạn là Trợ lý Mua Sắm AI thông minh của Sàn Thương Mại Điện Tử.
Hãy tuân thủ nghiêm ngặt các quy tắc sau:

1. TUYỆT ĐỐI KHÔNG được bịa đặt thông tin về chính sách, quy định, điều khoản của sàn. Chỉ trả lời dựa trên nội dung Context được cung cấp bên dưới.
2. Nếu Context không chứa thông tin liên quan đến câu hỏi chính sách, hãy trả lời:
   "Xin lỗi, tôi không tìm thấy thông tin về vấn đề này trong quy chế của sàn. Bạn vui lòng liên hệ Hotline CSKH: 1900-6868 hoặc gửi yêu cầu hỗ trợ để được giải đáp chi tiết hơn nhé!"
3. Khi người dùng tìm kiếm sản phẩm, mua sắm, kiểm tra giỏ hàng hoặc đơn hàng, bạn có các công cụ:
   - search_products: Tìm kiếm các sản phẩm trong kho hàng theo từ khóa, danh mục, khoảng giá.
   - get_product_details: Lấy thông số kỹ thuật chi tiết của 1 sản phẩm.
   - compare_products: So sánh cấu hình, giá bán, ưu/nhược điểm (highlights) của 2 hoặc nhiều sản phẩm.
   - add_to_cart: Thêm sản phẩm vào giỏ hàng.
   - get_cart: Xem giỏ hàng của khách.
   - update_cart_item / remove_cart_item: Điều chỉnh hoặc xóa sản phẩm trong giỏ.
   - get_orders / get_order_detail: Tra cứu đơn hàng.
   - cancel_order: Hủy đơn hàng (LUÔN hỏi xác nhận trước).
   - check_promotions: Kiểm tra voucher / mã giảm giá khả dụng.
   - escalate_to_ticket: Chuyển tiếp khiếu nại tới nhân viên CSKH khi khách giận dữ, bức xúc hoặc yêu cầu gặp người thật.
4. Khi khách hàng có dấu hiệu bức xúc (kêu giao hàng trễ, khiếu nại, tố lừa đảo, đòi gặp người thật), HÃY THỂ HIỆN SỰ THẤU CẢM và lập tức gọi công cụ escalate_to_ticket.
5. Đối với các hành động nhạy cảm (như hủy đơn), LUÔN nhắc nhở và hỏi xác nhận trước khi thực hiện.
6. Nếu khách hàng chưa đăng nhập mà yêu cầu xem giỏ hàng hoặc lịch sử đơn hàng, hãy nhắc khách đăng nhập trước.
7. Phản hồi bằng Tiếng Việt, lịch sự, thân thiện, ngắn gọn và định dạng Markdown rõ ràng.`;

    if (contextChunks && contextChunks.length > 0) {
      basePrompt += `\n\n--- DƯỚI ĐÂY LÀ CÁC ĐIỀU KHOẢN CHÍNH SÁCH CHÍNH THỨC CỦA SÀN (HÃY TRẢ LỜI DỰA TRÊN ĐÂY): ---\n`;
      contextChunks.forEach((chunk, index) => {
        basePrompt += `\n[Tài liệu ${index + 1} - ${chunk.document_title} (Độ khớp: ${chunk.score})]:\n${chunk.content}\n`;
      });
    }

    return basePrompt;
  }

  /**
   * Thực thi Tool Calling dựa trên tên công cụ
   */
  public async executeTool(
    toolName: string,
    args: any,
    customerId?: string | null,
    contextInfo?: { customerEmail?: string | null; customerName?: string | null; sessionId?: string | null }
  ): Promise<ToolExecutionResult> {
    try {
      switch (toolName) {
        // --- NHÓM 1: CATALOG TOOLS ---
        case 'search_products':
          return await catalogTool.searchProducts({
            query: args.query || '',
            category_id: args.category_id,
            min_price: args.min_price,
            max_price: args.max_price,
            sort: args.sort,
            limit: args.limit || 5,
          });

        case 'get_product_details':
          return await catalogTool.getProductDetails({
            product_id: args.product_id,
          });

        case 'compare_products':
          return await catalogTool.compareProducts({
            products: Array.isArray(args.products) ? args.products : [args.products],
          });

        // --- NHÓM 2: CART TOOLS ---
        case 'add_to_cart':
          return await cartTool.addToCart({
            customerId,
            productId: args.product_id,
            variantId: args.variant_id,
            quantity: args.quantity || 1,
          });

        case 'get_cart':
          return await cartTool.getCart({ customerId });

        case 'update_cart_item':
          return await cartTool.updateCartItem({
            customerId,
            itemId: args.item_id,
            quantity: args.quantity,
          });

        case 'remove_cart_item':
          return await cartTool.removeCartItem({
            customerId,
            itemId: args.item_id,
          });

        // --- NHÓM 3: ORDER TOOLS ---
        case 'get_orders':
          return await orderTool.getOrders({
            customerId,
            status: args.status,
            page: args.page,
            limit: args.limit,
          });

        case 'get_order_detail':
          return await orderTool.getOrderDetail({
            customerId,
            orderId: args.order_id,
          });

        case 'cancel_order':
          return await orderTool.cancelOrder({
            customerId,
            orderId: args.order_id,
            confirmed: args.confirmed,
            reason: args.reason,
          });

        // --- NHÓM 4: PROMOTION TOOLS ---
        case 'check_promotions':
          return await promotionTool.checkPromotions({
            productIds: args.product_ids,
          });

        // --- NHÓM 5: SUPPORT ESCALATE TOOL (NGÀY 8-9) ---
        case 'escalate_to_ticket':
          return await ticketTool.escalateToTicket({
            customerId,
            customerEmail: contextInfo?.customerEmail,
            customerName: contextInfo?.customerName,
            chatSessionId: contextInfo?.sessionId,
            reason: args.reason || 'Khách hàng yêu cầu hỗ trợ từ nhân viên CSKH',
            chatSummary: args.chat_summary,
            relatedOrderId: args.related_order_id,
          });

        default:
          return {
            success: false,
            text: `Không tìm thấy công cụ: ${toolName}`,
          };
      }
    } catch (err: any) {
      console.error(`[LlmOrchestrator] Lỗi khi thực thi tool ${toolName}:`, err.message);
      return {
        success: false,
        text: `Đã xảy ra lỗi khi thực thi lệnh: ${err.message}`,
        error: err.message,
      };
    }
  }

  /**
   * Phân tích ý định thông minh để gọi tool khi ở chế độ fallback hoặc API không hỗ trợ Function Calling
   */
  public detectIntent(message: string): { toolName: string | null; args: any } {
    const lower = message.toLowerCase().trim();

    // 0. Ý định khiếu nại, bức xúc hoặc yêu cầu gặp người thật -> Escalate sang Ticket CSKH (Mục 6.2)
    const escalateKeywords = [
      'gặp người thật', 'gặp nhân viên', 'nói chuyện với người', 'tổng đài viên', 'cskh',
      'lừa đảo', 'khiếu nại', 'bức xúc', 'tệ quá', 'làm ăn kiểu gì', 'kiện', 'báo công an',
      'tại sao chưa giao', 'trả tiền đây', 'không hài lòng'
    ];
    if (escalateKeywords.some((kw) => lower.includes(kw))) {
      return {
        toolName: 'escalate_to_ticket',
        args: {
          reason: message,
          chat_summary: `Khách hàng gửi phản ánh: "${message}"`,
        },
      };
    }

    // 1. Ý định xác nhận hủy đơn hàng
    if (lower.includes('xác nhận hủy đơn') || lower.includes('đồng ý hủy đơn') || lower.includes('chắc chắn hủy')) {
      const match = lower.match(/(?:hủy đơn|đơn hàng|mã đơn)\s*(?:#)?([a-zA-Z0-9_-]+)/);
      const orderId = match ? match[1] : 'ORD-2026-8899';
      return { toolName: 'cancel_order', args: { order_id: orderId, confirmed: true } };
    }

    // 2. Ý định yêu cầu hủy đơn hàng (bước 1 - hỏi xác nhận)
    if (lower.includes('hủy đơn') || lower.includes('cancel đơn') || lower.includes('không lấy hàng nữa')) {
      const match = lower.match(/(?:hủy đơn|đơn hàng|mã đơn)\s*(?:#)?([a-zA-Z0-9_-]+)/);
      const orderId = match ? match[1] : 'ORD-2026-8899';
      return { toolName: 'cancel_order', args: { order_id: orderId, confirmed: false } };
    }

    // 3. Ý định tra cứu chi tiết 1 đơn hàng cụ thể
    if (lower.includes('chi tiết đơn') || (lower.includes('đơn hàng') && (lower.includes('#') || lower.includes('ord-')))) {
      const match = lower.match(/(?:đơn hàng|mã đơn|chi tiết đơn)\s*(?:#)?([a-zA-Z0-9_-]+)/);
      const orderId = match ? match[1] : 'ORD-2026-8899';
      return { toolName: 'get_order_detail', args: { order_id: orderId } };
    }

    // 4. Ý định tra cứu danh sách đơn hàng
    if (
      lower.includes('đơn hàng của tôi') ||
      lower.includes('lịch sử mua') ||
      lower.includes('kiểm tra đơn') ||
      lower.includes('xem đơn hàng') ||
      lower.includes('đơn mua') ||
      lower.includes('hàng đã đặt')
    ) {
      let status: string | undefined;
      if (lower.includes('đang giao') || lower.includes('vận chuyển')) status = 'SHIPPING';
      if (lower.includes('đã giao') || lower.includes('hoàn thành')) status = 'COMPLETED';
      if (lower.includes('chờ thanh toán')) status = 'PENDING_PAYMENT';
      return { toolName: 'get_orders', args: { status, limit: 5 } };
    }

    // 5. Ý định tra cứu mã giảm giá / khuyến mãi / voucher
    if (
      lower.includes('khuyến mãi') ||
      lower.includes('mã giảm giá') ||
      lower.includes('voucher') ||
      lower.includes('ưu đãi') ||
      lower.includes('giảm giá có mã nào') ||
      lower.includes('freeship')
    ) {
      return { toolName: 'check_promotions', args: {} };
    }

    // 6. Ý định thêm vào giỏ hàng
    if (
      lower.includes('thêm vào giỏ') ||
      lower.includes('thêm giỏ hàng') ||
      lower.includes('mua ngay') ||
      lower.includes('bỏ vào giỏ') ||
      lower.includes('cho vào giỏ')
    ) {
      let productId = '44125e28-653e-4724-96d0-3dd405e85992'; // iPhone 15 Pro Max
      let variantId = '11111111-aaaa-bbbb-cccc-000000000001';
      let quantity = 1;

      const qtyMatch = lower.match(/(\d+)\s*(cái|chiếc|sp|sản phẩm)?/);
      if (qtyMatch) quantity = parseInt(qtyMatch[1], 10);

      if (lower.includes('samsung') || lower.includes('s24')) {
        productId = '55236f39-764f-4835-a7e1-4ee516f96003';
        variantId = '22222222-aaaa-bbbb-cccc-000000000001';
      }

      return {
        toolName: 'add_to_cart',
        args: { product_id: productId, variant_id: variantId, quantity },
      };
    }

    // 7. Ý định xem giỏ hàng
    if (
      lower.includes('xem giỏ') ||
      lower.includes('giỏ hàng của tôi') ||
      lower.includes('trong giỏ có gì') ||
      lower.includes('kiểm tra giỏ') ||
      lower.includes('mở giỏ hàng')
    ) {
      return { toolName: 'get_cart', args: {} };
    }

    // 8. Ý định xóa khỏi giỏ hàng
    if (lower.includes('xóa khỏi giỏ') || lower.includes('bỏ ra khỏi giỏ') || lower.includes('xóa sản phẩm trong giỏ')) {
      return { toolName: 'remove_cart_item', args: { item_id: 'sample-cart-item-id' } };
    }

    // 9. Ý định so sánh sản phẩm
    const hasCompareWord = ['so sánh', 'khác nhau', 'cái nào tốt hơn', 'hơn hay', 'giữa'].some((kw) => lower.includes(kw));
    const hasOrChoice = lower.includes('hay') && (lower.includes('nên mua') || lower.includes('chọn') || lower.includes('tốt hơn'));

    if (hasCompareWord || hasOrChoice) {
      let products: string[] = [];
      if (lower.includes('iphone') && lower.includes('samsung')) {
        products = ['iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra'];
      } else if (lower.includes('macbook') && (lower.includes('dell') || lower.includes('thinkpad') || lower.includes('asus'))) {
        products = ['MacBook Air M3', 'Dell XPS 13'];
      } else {
        products = ['iPhone 15 Pro Max 256GB', 'Samsung Galaxy S24 Ultra 5G'];
      }
      return { toolName: 'compare_products', args: { products } };
    }

    // 10. Ý định xem chi tiết sản phẩm cụ thể
    if (lower.includes('chi tiết') || lower.includes('thông số') || lower.includes('cấu hình')) {
      let query = message.replace(/(xem|chi tiết|thông số|cấu hình|của|sản phẩm)/gi, '').trim();
      return { toolName: 'get_product_details', args: { product_id: query || 'iphone-15-pro-max-256gb' } };
    }

    // 11. Ý định tìm kiếm / mua sắm sản phẩm
    const productKeywords = [
      'tìm', 'kiếm', 'mua', 'giá', 'bán', 'điện thoại', 'smartphone', 'laptop', 'tai nghe',
      'iphone', 'samsung', 'macbook', 'sony', 'chuột', 'bàn phím', 'màn hình', 'đồng hồ',
      'loa', 'áo', 'quần', 'giày', 'tư vấn', 'gợi ý', 'dưới', 'triệu'
    ];
    if (productKeywords.some((kw) => lower.includes(kw))) {
      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      const underMatch = lower.match(/(dưới|<|nhỏ hơn)\s*(\d+)\s*(triệu|tr)/);
      if (underMatch) {
        maxPrice = parseInt(underMatch[2], 10) * 1_000_000;
      }

      const aroundMatch = lower.match(/(tầm|khoảng|khoảng tầm)\s*(\d+)\s*(triệu|tr)/);
      if (aroundMatch) {
        const base = parseInt(aroundMatch[2], 10) * 1_000_000;
        minPrice = Math.max(0, base - 5_000_000);
        maxPrice = base + 5_000_000;
      }

      const cleanQuery = lower
        .replace(/(tôi|mình|em|bạn|hãy|tìm|kiếm|giúp|tư vấn|gợi ý|sản phẩm|cho|với|tầm|dưới|khoảng|\d+\s*(triệu|tr)|nhé|nha)/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        toolName: 'search_products',
        args: {
          query: cleanQuery || 'điện thoại',
          min_price: minPrice,
          max_price: maxPrice,
          limit: 5,
        },
      };
    }

    return { toolName: null, args: {} };
  }

  /**
   * Định nghĩa Gemini Function Declarations (Bao gồm Catalog, Cart, Order, Promotion, Escalate)
   */
  private getGeminiTools() {
    return [
      {
        functionDeclarations: [
          {
            name: 'search_products',
            description: 'Tìm kiếm sản phẩm trên sàn theo từ khóa, danh mục, khoảng giá hoặc sắp xếp.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                query: { type: SchemaType.STRING, description: 'Từ khóa tìm kiếm sản phẩm' },
                min_price: { type: SchemaType.NUMBER, description: 'Giá thấp nhất (VNĐ)' },
                max_price: { type: SchemaType.NUMBER, description: 'Giá cao nhất (VNĐ)' },
                limit: { type: SchemaType.INTEGER, description: 'Số lượng sản phẩm tối đa (mặc định 5)' },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_product_details',
            description: 'Lấy thông tin kỹ thuật, thông số chi tiết và biến thể của sản phẩm theo product_id hoặc slug.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                product_id: { type: SchemaType.STRING, description: 'Mã ID hoặc slug sản phẩm' },
              },
              required: ['product_id'],
            },
          },
          {
            name: 'compare_products',
            description: 'So sánh chi tiết 2 hoặc nhiều sản phẩm dựa trên thông số kỹ thuật, ưu nhược điểm và đưa ra gợi ý.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                products: {
                  type: SchemaType.ARRAY,
                  description: 'Danh sách tên hoặc ID các sản phẩm cần so sánh',
                  items: { type: SchemaType.STRING },
                },
              },
              required: ['products'],
            },
          },
          {
            name: 'add_to_cart',
            description: 'Thêm sản phẩm với biến thể cụ thể vào giỏ hàng của người dùng.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                product_id: { type: SchemaType.STRING, description: 'ID của sản phẩm' },
                variant_id: { type: SchemaType.STRING, description: 'ID biến thể của sản phẩm' },
                quantity: { type: SchemaType.INTEGER, description: 'Số lượng mua (mặc định 1)' },
              },
              required: ['product_id', 'variant_id'],
            },
          },
          {
            name: 'get_cart',
            description: 'Xem toàn bộ giỏ hàng hiện tại của người dùng.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {},
            },
          },
          {
            name: 'get_orders',
            description: 'Tra cứu danh sách các đơn hàng đã đặt của người dùng.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                status: { type: SchemaType.STRING, description: 'Lọc theo trạng thái (PENDING_PAYMENT, SHIPPING, COMPLETED, CANCELLED)' },
                limit: { type: SchemaType.INTEGER, description: 'Số đơn tối đa cần lấy' },
              },
            },
          },
          {
            name: 'get_order_detail',
            description: 'Xem chi tiết các mặt hàng và trạng thái giao hàng của 1 đơn hàng cụ thể.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                order_id: { type: SchemaType.STRING, description: 'Mã đơn hàng cần xem' },
              },
              required: ['order_id'],
            },
          },
          {
            name: 'cancel_order',
            description: 'Hủy đơn hàng đang trong trạng thái chờ xử lý (chỉ gọi khi người dùng đã xác nhận).',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                order_id: { type: SchemaType.STRING, description: 'Mã đơn hàng cần hủy' },
                confirmed: { type: SchemaType.BOOLEAN, description: 'Đã xác nhận hủy chưa' },
                reason: { type: SchemaType.STRING, description: 'Lý do hủy đơn' },
              },
              required: ['order_id'],
            },
          },
          {
            name: 'check_promotions',
            description: 'Tra cứu các voucher, mã giảm giá và chương trình khuyến mãi hiện có trên sàn.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {},
            },
          },
          {
            name: 'escalate_to_ticket',
            description: 'Tự động tạo ticket chuyển tiếp cho nhân viên CSKH khi khách hàng khiếu nại, bức xúc hoặc yêu cầu gặp người thật.',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                reason: { type: SchemaType.STRING, description: 'Lý do khiếu nại hoặc cần chuyển ticket' },
                chat_summary: { type: SchemaType.STRING, description: 'Tóm tắt nội dung trao đổi' },
                related_order_id: { type: SchemaType.STRING, description: 'Mã đơn hàng liên quan (nếu có)' },
              },
              required: ['reason'],
            },
          },
        ],
      },
    ];
  }

  /**
   * Stream câu trả lời của AI theo thời gian thực (Server-Sent Events) kết hợp Tool Calling
   */
  async streamResponse(
    options: OrchestratorStreamOptions
  ): Promise<OrchestratorResult> {
    const { messages, contextChunks, customerId, customerEmail, customerName, sessionId, onChunk, onMetadata } = options;
    const systemPrompt = this.buildSystemPrompt(contextChunks);
    const lastMessage = messages[messages.length - 1]?.content || '';
    let fullResponse = '';
    let executedMetadata: ToolMetadataPayload | null = null;
    const toolCallsRecord: Array<{ name: string; args: any; result: any }> = [];
    const contextInfo = { customerEmail, customerName, sessionId };

    // 1. Thử dùng Google Gemini SDK với Function Calling
    if (this.geminiClient && env.GEMINI_API_KEY) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
          tools: this.getGeminiTools() as any,
        });

        const history = messages.slice(0, -1).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage);

        for await (const chunk of result.stream) {
          const functionCalls = chunk.functionCalls();
          if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
              const toolResult = await this.executeTool(call.name, call.args, customerId, contextInfo);
              toolCallsRecord.push({ name: call.name, args: call.args, result: toolResult });
              if (toolResult.metadata) {
                executedMetadata = toolResult.metadata;
                onMetadata?.(toolResult.metadata);
              }
              if (toolResult.text) {
                fullResponse += toolResult.text;
                onChunk(toolResult.text);
              }
            }
          }

          const text = chunk.text();
          if (text) {
            fullResponse += text;
            onChunk(text);
          }
        }

        if (fullResponse.trim()) {
          return { fullText: fullResponse, metadata: executedMetadata, toolCalls: toolCallsRecord };
        }
      } catch (err: any) {
        console.warn('[LLM Orchestrator] Gemini streaming/tool calling failed, trying fallback:', err.message);
      }
    }

    // 2. Thử dùng OpenAI SDK (gpt-4o-mini)
    if (this.openaiClient && env.OPENAI_API_KEY) {
      try {
        const stream = await this.openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
        });

        for await (const part of stream) {
          const text = part.choices[0]?.delta?.content || '';
          if (text) {
            fullResponse += text;
            onChunk(text);
          }
        }

        if (fullResponse.trim()) {
          return { fullText: fullResponse, metadata: executedMetadata, toolCalls: toolCallsRecord };
        }
      } catch (err: any) {
        console.warn('[LLM Orchestrator] OpenAI streaming failed:', err.message);
      }
    }

    // 3. Fallback Smart Tool Execution & Streaming (khi chạy offline / dev không có API key)
    return await this.fallbackStreamWithTools(lastMessage, contextChunks, customerId, contextInfo, onChunk, onMetadata);
  }

  /**
   * Fallback trả lời thông minh kết hợp gọi Tool khi không có LLM API key
   */
  private async fallbackStreamWithTools(
    userMessage: string,
    contextChunks: RagChunkResult[],
    customerId?: string | null,
    contextInfo?: { customerEmail?: string | null; customerName?: string | null; sessionId?: string | null },
    onChunk?: (chunk: string) => void,
    onMetadata?: (metadata: ToolMetadataPayload) => void
  ): Promise<OrchestratorResult> {
    const { toolName, args } = this.detectIntent(userMessage);
    let fullResponse = '';
    let metadata: ToolMetadataPayload | null = null;
    const toolCallsRecord: any[] = [];

    // Nếu phát hiện ý định gọi Tool
    if (toolName) {
      const toolResult = await this.executeTool(toolName, args, customerId, contextInfo);
      toolCallsRecord.push({ name: toolName, args, result: toolResult });

      if (toolResult.metadata) {
        metadata = toolResult.metadata;
        onMetadata?.(toolResult.metadata);
      }

      fullResponse = toolResult.text;
    } else if (contextChunks && contextChunks.length > 0) {
      // Nếu câu hỏi về chính sách sàn -> Trả lời dựa trên RAG context
      fullResponse = `Dạ, theo chính sách chính thức của sàn (**${contextChunks[0].document_title}**):\n\n`;
      fullResponse += contextChunks[0].content + '\n\n';
      fullResponse += 'Nếu bạn cần thêm thông tin hoặc hỗ trợ gì khác, cứ nhắn cho mình nhé!';
    } else {
      // Câu chào hỏi / hướng dẫn thông thường
      fullResponse = `Chào bạn! Tôi là **Trợ lý Mua Sắm AI** của sàn thương mại điện tử.\n\n`;
      fullResponse += `Tôi có thể hỗ trợ bạn:\n`;
      fullResponse += `- 🔍 Tìm kiếm sản phẩm theo ngân sách & nhu cầu (*"Tìm điện thoại dưới 30 triệu"*)\n`;
      fullResponse += `- ⚖️ So sánh chi tiết cấu hình và ưu/nhược điểm (*"So sánh iPhone 15 Pro Max và Galaxy S24 Ultra"*)\n`;
      fullResponse += `- 🛒 Thêm sản phẩm vào giỏ hoặc xem giỏ hàng (*"Xem giỏ hàng của tôi"*)\n`;
      fullResponse += `- 📦 Tra cứu và quản lý đơn hàng (*"Kiểm tra đơn hàng của tôi"*)\n`;
      fullResponse += `- 🎟️ Săn mã giảm giá & khuyến mãi (*"Có mã voucher nào không"*)\n`;
      fullResponse += `- 🆘 Hỗ trợ giải quyết khiếu nại và kết nối với tổng đài CSKH.\n\n`;
      fullResponse += `Bạn đang quan tâm đến sản phẩm hoặc cần hỗ trợ gì ạ?`;
    }

    // Giả lập stream chữ chạy mượt mà
    if (onChunk) {
      const words = fullResponse.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise((r) => setTimeout(r, 20));
      }
    }

    return {
      fullText: fullResponse,
      metadata,
      toolCalls: toolCallsRecord,
    };
  }
}

export const llmOrchestrator = new LlmOrchestrator();
