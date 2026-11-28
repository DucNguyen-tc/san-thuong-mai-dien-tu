import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env';
import { RagChunkResult, STATIC_POLICIES } from './rag.service';
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

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export class LlmOrchestrator {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    if (env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY, maxRetries: 0, timeout: 5000 });
    }
  }

  /**
   * Tạo System Prompt chuẩn chỉnh theo Mục 4.3 trong tài liệu kiến trúc
   */
  private buildSystemPrompt(
    contextChunks: RagChunkResult[],
    customerId?: string | null,
    customerName?: string | null
  ): string {
    let basePrompt = `Bạn là Trợ lý Mua Sắm AI thông minh của Sàn Thương Mại Điện Tử V-Shop.
Hãy tuân thủ nghiêm ngặt các quy tắc sau:

1. QUY TẮC CHÍNH SÁCH / BẢO HÀNH / ĐỔI TRẢ / VẬN CHUYỂN / THANH TOÁN:
   - Khi người dùng hỏi về chính sách, bảo hành, đổi trả, hoàn tiền, vận chuyển, phí ship, hủy đơn, phương thức thanh toán:
     + Hãy sử dụng thông tin trong phần "DƯỚI ĐÂY LÀ CÁC ĐIỀU KHOẢN CHÍNH SÁCH CHÍNH THỨC CỦA SÀN" để giải đáp đầy đủ, chi tiết, tận tình, dễ hiểu và chuyên nghiệp.
     + Trình bày mạch lạc, dùng gạch đầu dòng rõ ràng, in đậm các ý chính quan trọng (Thời hạn, Điều kiện, Chi phí, Thời gian hoàn tiền/xử lý).
     + NẾU trong Context có thông tin liên quan, TUYỆT ĐỐI KHÔNG được từ chối hay nói không tìm thấy. Hãy tổng hợp thông tin từ Context để trả lời thỏa đáng cho khách hàng.
   - CHỈ KHI câu hỏi hoàn toàn xa lạ, không liên quan đến mua sắm/chính sách trên sàn hoặc hỏi về hàng cấm/vi phạm pháp luật, mới thông báo lịch sự và hướng dẫn liên hệ Hotline CSKH: 1900-6868.

2. QUY TẮC SẢN PHẨM / TÌM KIẾM / MUA SẮM:
   - Sàn thương mại điện tử V-Shop có 5 ngành hàng chính:
     1. Đồ gia dụng & Nhà cửa đời sống (Nội thất bàn ghế sofa, Thiết bị nhà bếp nồi chảo lò vi sóng, Đồ trang trí, Tạp hóa)
     2. Đồ điện tử & Công nghệ (Điện thoại, Laptop, Máy tính bảng, Đồng hồ thông minh, Tai nghe, Loa)
     3. Sức khỏe & Làm đẹp (Mỹ phẩm son môi, Nước hoa cao cấp Chanel/Dior/Gucci, Chăm sóc da)
     4. Thời trang & Phụ kiện (Áo sơ mi, Giày thể thao Nike/Puma, Váy đầm nữ, Túi xách Prada, Kính râm, Đồng hồ thời trang)
     5. Thể thao & Xe (Xe máy phân khối lớn Kawasaki, Dụng cụ thể thao tennis/bóng chuyền, Phương tiện)
   - TUYỆT ĐỐI KHÔNG sử dụng câu từ chối theo quy chế của sàn cho các câu hỏi về sản phẩm, tìm kiếm, mua sắm hoặc giỏ hàng.
   - Khi khách hàng hỏi tìm kiếm sản phẩm hoặc hỏi về bất kỳ ngành hàng nào (ví dụ: "đồ gia dụng", "mỹ phẩm", "thời trang", "điện thoại", "gợi ý sản phẩm", "có gì bán"), hãy LUÔN gọi công cụ search_products.
   - Khi tìm thấy sản phẩm, hệ thống tự động hiển thị các Thẻ sản phẩm trực quan (Product Cards) kèm hình ảnh, giá bán và nút bấm ở bên dưới. Bạn chỉ cần phản hồi một câu ngắn gọn giới thiệu các sản phẩm tìm được và mời khách xem trên các thẻ bên dưới, TUYỆT ĐỐI KHÔNG lặp lại danh sách văn bản dạng gạch đầu dòng dài dòng.

3. QUY TẮC GIỎ HÀNG VÀ ĐƠN HÀNG:
${
  customerId
    ? `   - Khách hàng HIỆN TẠI ĐÃ ĐĂNG NHẬP THÀNH CÔNG (Mã khách hàng ID: ${customerId}${customerName ? `, Tên: ${customerName}` : ''}).
   - Khi khách hàng yêu cầu kiểm tra đơn hàng, xem giỏ hàng hoặc thêm giỏ: BẮT BUỘC GỌI CÔNG CỤ get_orders, get_cart hoặc add_to_cart! TUYỆT ĐỐI KHÔNG bảo khách đăng nhập vì khách ĐÃ đăng nhập rồi!
   - TUYỆT ĐỐI KHÔNG HỦY ĐƠN TRỰC TIẾP QUA CHATBOT. Khi khách yêu cầu hủy đơn hàng (hoặc hỏi về việc hủy đơn, cancel đơn): Gọi công cụ guide_cancel_order để hướng dẫn khách truy cập trang Quản lý đơn hàng (tại [Quản lý đơn hàng](/profile?tab=orders)) để thao tác bảo mật trực tiếp trên hệ thống!`
    : `   - Khách hàng HIỆN TẠI CHƯA ĐĂNG NHẬP (Khách vãng lai / Guest).
   - Khi khách hàng hỏi xem giỏ hàng hoặc lịch sử đơn hàng cá nhân, hãy nhắc nhở lịch sự:
     "Bạn vui lòng đăng nhập vào tài khoản của mình trước (ở góc trên bên phải màn hình) để mình có thể kiểm tra giỏ hàng/đơn hàng cho bạn nhé!"`
}

4. BẢO VỆ AN TOÀN VÀ HÀNG CẤM:
   - Sàn cấm kinh doanh vũ khí, chất cấm, tiền giả, hàng lậu. Nếu khách hỏi những thứ này, từ chối lịch sự và nêu rõ quy định pháp luật.

5. PHẢN HỒI THÂN THIỆN:
   - Luôn trả lời bằng Tiếng Việt, lịch sự, chuyên nghiệp, thấu cảm và định dạng Markdown rõ ràng.

6. QUY TẮC XỬ LÝ KHIẾU NẠI, BỨC XÚC HOẶC YÊU CẦU GẶP NGƯỜI THẬT:
   - Khi khách hàng tức giận, bức xúc, khó chịu, chửi bới (ví dụ: "mày rất ngu", "tao rất bực", "làm ăn như hạch", "thất vọng") hoặc yêu cầu gặp người thật/nhân viên CSKH:
     + BẮT BUỘC GỌI CÔNG CỤ escalate_to_ticket ngay lập tức.
     + Tuyệt đối không chỉ xin lỗi suông qua loa, phải tạo ticket để nhân viên hỗ trợ kịp thời.

7. QUY TẮC TÌM KIẾM SẢN PHẨM KHÔNG CÓ TRÊN SÀN (ANTI-HALLUCINATION):
   - Khi công cụ search_products trả về thông báo không tìm thấy sản phẩm (success: false hoặc không có danh sách sản phẩm):
     + TUYỆT ĐỐI KHÔNG tự bịa đặt hoặc đề xuất các sản phẩm không liên quan (ví dụ: khách tìm đồ ăn "trứng rán", "sói cô độc" mà lại hiển thị điện thoại, laptop là vi phạm nghiêm trọng).
     + Hãy thông báo lịch sự là sàn hiện chưa kinh doanh sản phẩm này và gợi ý 5 ngành hàng chính của sàn (Điện tử, Gia dụng, Thời trang, Sức khỏe làm đẹp, Thể thao).`;

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
        case 'add_to_cart': {
          let targetProductId = args.product_id;
          let targetVariantId = args.variant_id;

          // Nếu có từ khóa hoặc chưa có variant_id thật, tự động tìm sản phẩm thật trong catalog-service
          if (args.query) {
            const searchRes = await catalogTool.searchProducts({ query: args.query, limit: 1 });
            const foundProduct = searchRes.metadata?.type === 'product_cards' ? searchRes.metadata.products[0] : null;
            if (foundProduct?.variant_id) {
              targetProductId = foundProduct.id;
              targetVariantId = foundProduct.variant_id;
            } else {
              return {
                success: false,
                text: `Dạ rất tiếc, sản phẩm **"${args.query}"** hiện chưa có sẵn trong kho hàng của shop. Bạn có thể tham khảo các sản phẩm khác hoặc bảo mình tìm kiếm giúp bạn nhé!`,
              };
            }
          }

          if (!targetProductId) targetProductId = 'dd8e78ca-5693-4401-8db8-e4e8025fc1f2';
          if (!targetVariantId) targetVariantId = 'c13a2953-c587-47cd-8bea-9f432aa07234';

          return await cartTool.addToCart({
            customerId,
            productId: targetProductId,
            variantId: targetVariantId,
            quantity: args.quantity || 1,
          });
        }

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
        case 'guide_cancel_order':
          return {
            success: true,
            text: `📦 **Hướng dẫn hủy đơn hàng:**\n\nĐể đảm bảo an toàn và quyền lợi cho đơn hàng, sàn không hỗ trợ hủy đơn qua chatbot.\n👉 Bạn vui lòng truy cập trang **[Quản lý đơn hàng](/profile?tab=orders)** và chọn đơn hàng cần hủy để thực hiện trực tiếp trên hệ thống nhé! 😊`,
          };

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
   * Nhận diện cảm xúc tiêu cực, bức xúc, giận dữ, xúc phạm hoặc yêu cầu gặp nhân viên CSKH
   */
  public isEscalationOrAngry(message: string): boolean {
    if (!message || typeof message !== 'string') return false;
    const lower = message.toLowerCase().trim();
    const unaccented = removeVietnameseTones(lower);

    // 1. Nhóm từ khóa bức xúc, bực tức, giận dữ, xúc phạm
    const angryPatterns = [
      /\b(bực|rất bực|quá bực|bực mình|bực cả mình|bực bội|phát bực)\b/i,
      /\b(tức|rất tức|quá tức|tức mình|tức cả mình|tức điên|phát tức)\b/i,
      /\b(bức xúc|phát điên|điên tiết|điên người|khó chịu)\b/i,
      /\b(ngu|rất ngu|quá ngu|mày ngu|đồ ngu|óc chó|con bot ngu|ai ngu|ngu ngốc|ngu dốt|dốt)\b/i,
      /\b(vớ vẩn|tào lao|nhảm nhí|xàm|vô dụng|vô tích sự)\b/i,
      /\b(tệ quá|quá tệ|tệ hại|dở quá|chán quá|thất vọng|quá thất vọng)\b/i,
      /\b(làm ăn kiểu gì|làm ăn như|như hạch|như cc|như cặc|như l|như loz)\b/i,
      /\b(lừa đảo|gian dối|treo đầu dê|trả tiền đây|đòi tiền|báo công an|kiện|tố cáo)\b/i,
    ];

    if (angryPatterns.some((pattern) => pattern.test(lower) || pattern.test(unaccented))) {
      return true;
    }

    // 2. Nhóm yêu cầu gặp nhân viên / người thật / CSKH
    const agentRequestKeywords = [
      'gặp người thật', 'gap nguoi that',
      'gặp nhân viên', 'gap nhan vien',
      'nói chuyện với người', 'noi chuyen voi nguoi',
      'tổng đài viên', 'tong dai vien',
      'cskh', 'chăm sóc khách hàng', 'cham soc khach hang',
      'nhân viên tư vấn', 'nhan vien tu van',
      'khiếu nại', 'khieu nai',
      'yêu cầu hỗ trợ', 'yeu cau ho tro',
      'gặp trực tiếp', 'gap truc tiep',
      'cho tôi gặp người', 'cho gap nguoi',
      'chuyển máy', 'chuyen may',
      'gọi điện thoại cho tôi', 'goi dien cho toi',
      'kết nối nhân viên', 'ket noi nhan vien'
    ];

    if (agentRequestKeywords.some((kw) => lower.includes(kw) || unaccented.includes(kw))) {
      return true;
    }

    return false;
  }

  /**
   * Phân tích ý định thông minh để gọi tool khi ở chế độ fallback hoặc API không hỗ trợ Function Calling
   */
  public detectIntent(message: string): { toolName: string | null; args: any } {
    const lower = message.toLowerCase().trim();
    const unaccented = removeVietnameseTones(lower);

    // -1. Kiểm tra danh mục hàng cấm / quy chế không cho phép -> Không gọi tool tìm kiếm sản phẩm (Anti-Hallucination)
    const prohibitedKeywords = ['vũ khí', 'súng', 'đạn', 'chất cấm', 'ma túy', 'hàng cấm', 'pháo hoa', 'tiền giả', 'bán vũ khí'];
    if (prohibitedKeywords.some((kw) => lower.includes(kw))) {
      return { toolName: null, args: {} };
    }

    // 0. Ý định khiếu nại, bức xúc hoặc yêu cầu gặp người thật -> Escalate sang Ticket CSKH (Mục 6.2)
    if (this.isEscalationOrAngry(message)) {
      return {
        toolName: 'escalate_to_ticket',
        args: {
          reason: message,
          chat_summary: `Khách hàng phản ánh bức xúc qua chat: "${message}"`,
        },
      };
    }

    // 1. Ý định hủy đơn hàng -> Hướng dẫn truy cập trang Quản lý đơn hàng
    if (
      lower.includes('hủy đơn') ||
      unaccented.includes('huy don') ||
      lower.includes('cancel đơn') ||
      lower.includes('không lấy hàng nữa') ||
      lower.includes('muốn hủy') ||
      lower.includes('huỷ đơn')
    ) {
      return { toolName: 'guide_cancel_order', args: {} };
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
    const isAddToCart =
      (lower.includes('thêm') && (lower.includes('giỏ') || lower.includes('cart'))) ||
      lower.includes('thêm vào giỏ') ||
      lower.includes('thêm giỏ hàng') ||
      lower.includes('mua ngay') ||
      lower.includes('bỏ vào giỏ') ||
      lower.includes('cho vào giỏ');

    if (isAddToCart) {
      let quantity = 1;
      const qtyMatch = lower.match(/(?:số lượng|sl|mua)\s*(\d+)/i) || lower.match(/\b(\d+)\s*(?:cái|chiếc|sp|sản phẩm)\b/i);
      if (qtyMatch) {
        const parsed = parseInt(qtyMatch[1], 10);
        if (parsed > 0 && parsed <= 100) {
          quantity = parsed;
        }
      }

      // Trích xuất tên sản phẩm tìm kiếm nếu có
      let query = '';
      const quoted = message.match(/["'“]([^"'”]+)["'”]/);
      if (quoted) {
        query = quoted[1].trim();
      } else {
        const cleaned = lower
          .replace(/^(?:hãy\s*)?thêm\s*(?:sản phẩm\s*)?/i, '')
          .replace(/(?:vào giỏ hàng|vào giỏ|giúp tôi|nhé|nha|với).*$/i, '')
          .trim();
        if (cleaned.length > 2) {
          query = cleaned;
        }
      }

      return {
        toolName: 'add_to_cart',
        args: { query, quantity },
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

    // 10.5. Ý định xem liên kết, bấm vào xem sản phẩm
    if (
      lower.includes('bấm vào xem') ||
      lower.includes('bam vao xem') ||
      lower.includes('muốn xem') ||
      lower.includes('cho tôi link') ||
      lower.includes('link đâu') ||
      lower.includes('xem ở đâu') ||
      lower.includes('cho link') ||
      lower.includes('vào xem')
    ) {
      return { toolName: 'search_products', args: { query: 'điện thoại', limit: 4 } };
    }

    // 10.6. Ý định yêu cầu ghi hết ra / liệt kê tất cả sản phẩm
    if (
      lower.includes('ghi hết ra') ||
      lower.includes('ghi het ra') ||
      lower.includes('liệt kê hết') ||
      lower.includes('liet ke het') ||
      lower.includes('kể hết') ||
      lower.includes('kể ra') ||
      lower.includes('cho xem hết') ||
      lower.includes('có những gì') ||
      lower.includes('tất cả các mẫu') ||
      lower === 'tat ca' ||
      lower === 'tất cả'
    ) {
      return { toolName: 'search_products', args: { query: 'điện thoại', limit: 5 } };
    }

    // 11. Ý định tìm kiếm / mua sắm sản phẩm
    const productKeywords = [
      'tìm', 'kiếm', 'mua', 'giá', 'bán', 'điện thoại', 'smartphone', 'laptop', 'loptop', 'tai nghe',
      'iphone', 'samsung', 'macbook', 'sony', 'chuột', 'bàn phím', 'màn hình', 'đồng hồ',
      'loa', 'áo', 'quần', 'giày', 'tư vấn', 'gợi ý', 'dưới', 'triệu',
      'dt', 'đt', 'rẻ', 'ghẻ', 'đồ điện tử', 'điện tử', 'công nghệ', 'thiết bị',
      'gia dụng', 'đồ gia dụng', 'nhà cửa', 'đời sống', 'nhà bếp', 'bếp', 'nồi', 'chảo', 'lò vi sóng', 'máy xay',
      'nội thất', 'bàn', 'ghế', 'sofa', 'giường', 'tủ', 'đèn', 'decor', 'trang trí', 'tạp hóa', 'cà phê',
      'mỹ phẩm', 'làm đẹp', 'son', 'son môi', 'mascara', 'phấn', 'nước hoa', 'chăm sóc da', 'sữa tắm', 'dưỡng da', 'skincare',
      'thời trang', 'váy', 'đầm', 'túi xách', 'kính', 'kính râm', 'trang sức', 'khuyên tai',
      'thể thao', 'xe', 'xe máy', 'mô tô', 'vợt', 'tennis', 'bóng chuyền', 'ô tô',
      'có gì', 'bán gì', 'sản phẩm hot', 'bán chạy', 'tất cả'
    ];
    if (
      productKeywords.some((kw) => lower.includes(kw) || unaccented.includes(kw)) ||
      lower.includes('có') && (lower.includes('điện thoại') || unaccented.includes('dien thoai'))
    ) {
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

      let cleanQuery = lower
        .replace(/(tôi|mình|em|bạn|hãy|tìm|kiếm|giúp|tư vấn|gợi ý|sản phẩm|cho|với|tầm|dưới|khoảng|\d+\s*(triệu|tr)|nhé|nha|có|nào|ko|không|bán|ghẻ|rẻ)/gi, ' ')
        .replace(/\b(dt|đt)\b/gi, 'điện thoại')
        .replace(/\s+/g, ' ')
        .trim();

      const isBoth =
        (lower.includes('điện thoại') || unaccented.includes('dien thoai') || /\b(dt|đt)\b/i.test(lower)) &&
        (lower.includes('laptop') || unaccented.includes('loptop') || unaccented.includes('may tinh'));

      const isElectronics =
        lower.includes('đồ điện tử') || unaccented.includes('do dien tu') || lower.includes('điện tử') || unaccented.includes('dien tu');

      const isHomeLiving =
        lower.includes('gia dụng') || unaccented.includes('gia dung') || lower.includes('nhà cửa') || unaccented.includes('nha cua');

      const isBeauty =
        lower.includes('mỹ phẩm') || unaccented.includes('my pham') || lower.includes('làm đẹp') || unaccented.includes('lam dep') || lower.includes('nước hoa');

      const isFashion =
        lower.includes('thời trang') || unaccented.includes('thoi trang') || lower.includes('quần áo') || unaccented.includes('quan ao');

      const isPhone =
        lower.includes('dt') ||
        lower.includes('đt') ||
        lower.includes('điện thoại') ||
        unaccented.includes('dien thoai');

      if (isBoth) {
        cleanQuery = 'điện thoại và laptop';
      } else if (isElectronics) {
        cleanQuery = 'đồ điện tử';
      } else if (isHomeLiving) {
        cleanQuery = 'đồ gia dụng';
      } else if (isBeauty) {
        cleanQuery = 'mỹ phẩm';
      } else if (isFashion) {
        cleanQuery = 'thời trang';
      } else if (!cleanQuery && isPhone) {
        cleanQuery = 'điện thoại';
      }

      return {
        toolName: 'search_products',
        args: {
          query: cleanQuery || (isPhone ? 'điện thoại' : lower),
          min_price: minPrice,
          max_price: maxPrice,
          limit: isElectronics || isHomeLiving || isFashion || isBeauty ? 8 : 6,
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
            name: 'guide_cancel_order',
            description: 'Hướng dẫn người dùng quy trình hủy đơn hàng qua trang Quản lý đơn hàng (chatbot không hỗ trợ hủy đơn trực tiếp để bảo vệ tài khoản).',
            parameters: {
              type: SchemaType.OBJECT,
              properties: {},
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
   * Định nghĩa OpenAI Function Tools tương ứng
   */
  private getOpenAiTools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'search_products',
          description: 'Tìm kiếm sản phẩm trên sàn theo từ khóa, danh mục, khoảng giá hoặc sắp xếp.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Từ khóa tìm kiếm sản phẩm' },
              min_price: { type: 'number', description: 'Giá thấp nhất (VNĐ)' },
              max_price: { type: 'number', description: 'Giá cao nhất (VNĐ)' },
              limit: { type: 'integer', description: 'Số lượng sản phẩm tối đa (mặc định 5)' },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_product_details',
          description: 'Lấy thông tin kỹ thuật, thông số chi tiết và biến thể của sản phẩm theo product_id hoặc slug.',
          parameters: {
            type: 'object',
            properties: {
              product_id: { type: 'string', description: 'Mã ID hoặc slug sản phẩm' },
            },
            required: ['product_id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'compare_products',
          description: 'So sánh chi tiết 2 hoặc nhiều sản phẩm dựa trên thông số kỹ thuật, ưu nhược điểm và đưa ra gợi ý.',
          parameters: {
            type: 'object',
            properties: {
              products: {
                type: 'array',
                description: 'Danh sách tên hoặc ID các sản phẩm cần so sánh',
                items: { type: 'string' },
              },
            },
            required: ['products'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'add_to_cart',
          description: 'Thêm sản phẩm vào giỏ hàng của người dùng.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Tên hoặc từ khóa sản phẩm muốn thêm vào giỏ' },
              product_id: { type: 'string', description: 'ID của sản phẩm (nếu có)' },
              variant_id: { type: 'string', description: 'ID biến thể của sản phẩm (nếu có)' },
              quantity: { type: 'integer', description: 'Số lượng mua (mặc định 1)' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_cart',
          description: 'Xem toàn bộ giỏ hàng hiện tại của người dùng.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_orders',
          description: 'Tra cứu danh sách đơn hàng của người dùng.',
          parameters: {
            type: 'object',
            properties: {
              status: { type: 'string', description: 'Trạng thái đơn hàng' },
              limit: { type: 'integer', description: 'Số lượng đơn hàng hiển thị' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'guide_cancel_order',
          description: 'Hướng dẫn người dùng hủy đơn hàng qua trang Quản lý đơn hàng (chatbot không hỗ trợ hủy đơn trực tiếp để bảo vệ tài khoản).',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'check_promotions',
          description: 'Tra cứu các voucher, mã giảm giá và chương trình khuyến mãi hiện có trên sàn.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'escalate_to_ticket',
          description: 'Tự động tạo ticket chuyển tiếp cho nhân viên CSKH khi khách hàng khiếu nại, bức xúc hoặc yêu cầu gặp người thật.',
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string', description: 'Lý do khiếu nại hoặc cần chuyển ticket' },
              chat_summary: { type: 'string', description: 'Tóm tắt nội dung trao đổi' },
              related_order_id: { type: 'string', description: 'Mã đơn hàng liên quan (nếu có)' },
            },
            required: ['reason'],
          },
        },
      },
    ];
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, serviceName: string): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`[Timeout] ${serviceName} không phản hồi sau ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  /**
   * Stream câu trả lời của AI theo thời gian thực (Server-Sent Events) kết hợp Tool Calling
   */
  async streamResponse(
    options: OrchestratorStreamOptions
  ): Promise<OrchestratorResult> {
    const { messages, contextChunks, customerId, customerEmail, customerName, sessionId, onChunk, onMetadata } = options;
    const systemPrompt = this.buildSystemPrompt(contextChunks, customerId, customerName);
    const lastMessage = messages[messages.length - 1]?.content || '';
    let fullResponse = '';
    let executedMetadata: ToolMetadataPayload | null = null;
    const toolCallsRecord: Array<{ name: string; args: any; result: any }> = [];
    const contextInfo = { customerEmail, customerName, sessionId };
    const LLM_TIMEOUT_MS = 15000;

    // 0. Nhận diện khẩn cấp: Khách hàng bức xúc, bực tức, xúc phạm hoặc yêu cầu gặp nhân viên CSKH
    // Ngay lập tức gọi escalate_to_ticket tạo Ticket P1 trong support-service, phản hồi thấu cảm tức thì
    if (this.isEscalationOrAngry(lastMessage)) {
      console.log(`[LlmOrchestrator] Phát hiện cảm xúc bức xúc / khiếu nại / yêu cầu CSKH: "${lastMessage}" -> Tự động chuyển tiếp Ticket P1`);
      const toolResult = await this.executeTool(
        'escalate_to_ticket',
        {
          reason: lastMessage,
          chat_summary: `Khách hàng phản ánh bức xúc qua chat: "${lastMessage}"`,
        },
        customerId,
        contextInfo
      );
      toolCallsRecord.push({ name: 'escalate_to_ticket', args: { reason: lastMessage }, result: toolResult });

      if (onChunk && toolResult.text) {
        const words = toolResult.text.split(' ');
        for (const w of words) {
          onChunk(w + ' ');
          await new Promise((r) => setTimeout(r, 20));
        }
      }
      return {
        fullText: toolResult.text,
        metadata: null,
        toolCalls: toolCallsRecord,
      };
    }

    // 1. Thử dùng Google Gemini SDK với Function Calling (có Timeout bảo vệ)
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
        const result = await this.withTimeout(
          chat.sendMessageStream(lastMessage),
          LLM_TIMEOUT_MS,
          'Google Gemini 1.5 Flash'
        );

        for await (const chunk of result.stream) {
          const functionCalls = chunk.functionCalls();
          if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
              const toolResult = await this.executeTool(call.name, call.args, customerId, contextInfo);
              toolCallsRecord.push({ name: call.name, args: call.args, result: toolResult });
              if (toolResult.metadata) {
                if (toolResult.metadata.type === 'product_cards' && executedMetadata?.type === 'product_cards') {
                  const existingList: any[] = (executedMetadata as any)?.products || [];
                  const incomingList: any[] = (toolResult.metadata as any)?.products || [];
                  const mergedList: any[] = [...existingList, ...incomingList].filter(
                    (p: any, idx: number, arr: any[]) => arr.findIndex((item: any) => item.id === p.id) === idx
                  );
                  executedMetadata = {
                    type: 'product_cards',
                    products: mergedList,
                  };
                  onMetadata?.(executedMetadata);
                } else {
                  executedMetadata = toolResult.metadata;
                  onMetadata?.(toolResult.metadata);
                }
              }
              if (toolResult.text) {
                if (fullResponse && toolResult.metadata?.type === 'product_cards' && executedMetadata?.type === 'product_cards') {
                  // Đã có câu thông báo tìm sản phẩm rồi, không lặp lại
                } else {
                  fullResponse += (fullResponse ? '\n\n' : '') + toolResult.text;
                  onChunk(toolResult.text);
                }
              }
            }
          }

          const text = chunk.text();
          if (text) {
            const isDuplicateProductIntro =
              executedMetadata?.type === 'product_cards' &&
              fullResponse.includes('tìm thấy') &&
              (text.includes('tìm thấy') || text.includes('phù hợp với yêu cầu') || fullResponse.trim() === text.trim());

            if (!isDuplicateProductIntro) {
              fullResponse += text;
              onChunk(text);
            }
          }
        }

        if (fullResponse.trim()) {
          return { fullText: fullResponse, metadata: executedMetadata, toolCalls: toolCallsRecord };
        }
      } catch (err: any) {
        console.warn('[LLM Orchestrator] Gemini streaming/tool calling failed or timed out, trying OpenAI:', err.message);
      }
    }

    // 2. Thử dùng OpenAI SDK (gpt-4o-mini) kèm Function Calling (có Timeout bảo vệ)
    if (this.openaiClient && env.OPENAI_API_KEY) {
      try {
        const completion = await this.withTimeout(
          this.openaiClient.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            tools: this.getOpenAiTools(),
            tool_choice: 'auto',
          }),
          LLM_TIMEOUT_MS,
          'OpenAI GPT-4o-mini'
        );

        const choice = completion.choices[0];
        const msg = choice?.message;

        if (msg?.tool_calls && msg.tool_calls.length > 0) {
          for (const call of msg.tool_calls) {
            let parsedArgs: any = {};
            try {
              parsedArgs = JSON.parse(call.function.arguments || '{}');
            } catch {
              parsedArgs = {};
            }
            const toolResult = await this.executeTool(call.function.name, parsedArgs, customerId, contextInfo);
            toolCallsRecord.push({ name: call.function.name, args: parsedArgs, result: toolResult });
            if (toolResult.metadata) {
              if (toolResult.metadata.type === 'product_cards' && executedMetadata?.type === 'product_cards') {
                const existingList: any[] = (executedMetadata as any)?.products || [];
                const incomingList: any[] = (toolResult.metadata as any)?.products || [];
                const mergedList: any[] = [...existingList, ...incomingList].filter(
                  (p: any, idx: number, arr: any[]) => arr.findIndex((item: any) => item.id === p.id) === idx
                );
                executedMetadata = {
                  type: 'product_cards',
                  products: mergedList,
                };
                onMetadata?.(executedMetadata);
              } else {
                executedMetadata = toolResult.metadata;
                onMetadata?.(toolResult.metadata);
              }
            }
            if (toolResult.text) {
              if (fullResponse && toolResult.metadata?.type === 'product_cards' && executedMetadata?.type === 'product_cards') {
                // Đã có câu thông báo tìm sản phẩm rồi, không lặp lại
              } else {
                fullResponse += (fullResponse ? '\n\n' : '') + toolResult.text;
                onChunk(toolResult.text);
              }
            }
          }
        } else if (msg?.content) {
          fullResponse = msg.content;
          onChunk(msg.content);
        }

        if (fullResponse.trim()) {
          return { fullText: fullResponse, metadata: executedMetadata, toolCalls: toolCallsRecord };
        }
      } catch (err: any) {
        console.warn('[LLM Orchestrator] OpenAI streaming failed or timed out:', err.message);
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

    const lower = userMessage.toLowerCase().trim();
    const unaccented = removeVietnameseTones(lower);
    const policyKeywords = ['chính sách', 'đổi trả', 'bảo hành', 'hoàn tiền', 'vận chuyển', 'giao hàng', 'phí ship', 'thanh toán', 'quy định', 'hủy đơn', 'quy chế', 'hướng dẫn', 'điều khoản'];
    const isPolicyQuery = policyKeywords.some((kw) => lower.includes(kw) || unaccented.includes(removeVietnameseTones(kw)));

    // Nếu phát hiện ý định gọi Tool
    if (toolName) {
      const toolResult = await this.executeTool(toolName, args, customerId, contextInfo);
      toolCallsRecord.push({ name: toolName, args, result: toolResult });

      if (toolResult.metadata) {
        metadata = toolResult.metadata;
        onMetadata?.(toolResult.metadata);
      }

      fullResponse = toolResult.text;
    } else if (isPolicyQuery) {
      // Tìm chunk chính sách phù hợp nhất từ contextChunks hoặc STATIC_POLICIES
      let policyDoc = contextChunks && contextChunks.length > 0 ? contextChunks[0] : null;
      if (!policyDoc) {
        if (unaccented.includes('doi tra') || unaccented.includes('tra hang') || unaccented.includes('hoan tien')) {
          policyDoc = STATIC_POLICIES.find((p) => p.document_id === 'doc-policy-refund') || null;
        } else if (unaccented.includes('bao hanh')) {
          policyDoc = STATIC_POLICIES.find((p) => p.document_id === 'doc-policy-warranty') || null;
        } else if (
          unaccented.includes('van chuyen') ||
          unaccented.includes('giao hang') ||
          unaccented.includes('phi ship') ||
          unaccented.includes('freeship')
        ) {
          policyDoc = STATIC_POLICIES.find((p) => p.document_id === 'doc-policy-shipping') || null;
        } else if (unaccented.includes('huy don')) {
          policyDoc = STATIC_POLICIES.find((p) => p.document_id === 'doc-policy-cancel') || null;
        } else if (unaccented.includes('thanh toan') || unaccented.includes('vnpay') || unaccented.includes('momo') || unaccented.includes('cod')) {
          policyDoc = STATIC_POLICIES.find((p) => p.document_id === 'doc-policy-payment') || null;
        } else {
          policyDoc = STATIC_POLICIES[0];
        }
      }

      if (policyDoc) {
        fullResponse = `Dạ, thông tin chi tiết về **${policyDoc.document_title}** của sàn như sau:\n\n`;
        fullResponse += policyDoc.content + '\n\n';
        fullResponse += '💡 Nếu bạn có thắc mắc thêm về đơn hàng hoặc cần hỗ trợ khác, cứ nhắn cho mình nhé!';
      } else {
        fullResponse = `Dạ, theo quy chế của sàn, mọi đơn hàng đều được đảm bảo quyền lợi đổi trả trong 7 ngày, bảo hành chính hãng và hỗ trợ thanh toán an toàn. Bạn cần hỗ trợ thêm thông tin chi tiết nào ạ?`;
      }
    } else {
      // Kiểm tra câu hỏi ngoài phạm vi / hàng cấm / quy chế không có (Anti-Hallucination - Kịch bản 4)
      const prohibitedKeywords = ['vũ khí', 'súng', 'đạn', 'chất cấm', 'ma túy', 'hàng cấm', 'pháo hoa', 'tiền giả', 'bán vũ khí'];
      const isProhibited = prohibitedKeywords.some((kw) => lower.includes(kw));

      if (isProhibited) {
        fullResponse = `Xin lỗi, tôi không tìm thấy thông tin về vấn đề này trong quy chế hoạt động của sàn. Sàn nghiêm cấm kinh doanh các mặt hàng thuộc danh mục hàng cấm theo quy định của pháp luật. Bạn vui lòng liên hệ Hotline CSKH: 1900-6868 hoặc gửi yêu cầu hỗ trợ để được giải đáp chi tiết hơn nhé!`;
      } else if (lower.includes('hiểu') || lower.includes('nghe') || lower.includes('nói gì') || lower.includes('là ai')) {
        fullResponse = `Dạ mình hiểu rất rõ bạn nhé! 😊\n\nMình là **Trợ lý Mua sắm AI**, sẵn sàng hỗ trợ bạn:\n- 🔍 Tìm kiếm sản phẩm (*"Tìm điện thoại dưới 30 triệu"*, *"Tìm laptop mỏng nhẹ"*)\n- 🛒 Thêm vào giỏ hoặc xem giỏ hàng (*"Xem giỏ hàng của tôi"*)\n- ⚖️ So sánh sản phẩm (*"So sánh iPhone 15 và Galaxy S24"*)\n- 📦 Tra cứu tình trạng đơn hàng\n- 📜 Giải đáp chính sách bảo hành, đổi trả của sàn.\n\nBạn đang quan tâm đến sản phẩm nào hay cần mình hỗ trợ gì ạ?`;
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
