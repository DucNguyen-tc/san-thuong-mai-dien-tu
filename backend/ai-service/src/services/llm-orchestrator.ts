import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env';
import { RagChunkResult } from './rag.service';
import { catalogTool, ToolMetadataPayload, ToolExecutionResult } from '../tools/catalog.tool';

export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OrchestratorStreamOptions {
  messages: ChatMessageParam[];
  contextChunks: RagChunkResult[];
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
3. Khi người dùng tìm kiếm sản phẩm hoặc hỏi mua sắm, bạn có các công cụ:
   - search_products: Tìm kiếm các sản phẩm trong kho hàng theo từ khóa, danh mục, khoảng giá.
   - get_product_details: Lấy thông số kỹ thuật chi tiết của 1 sản phẩm.
   - compare_products: So sánh cấu hình, giá bán và đặc điểm của 2 hoặc nhiều sản phẩm.
4. Khi trả lời về sản phẩm, hãy giới thiệu ngắn gọn, lịch sự, nêu rõ ưu điểm chính.
5. Đối với các hành động nhạy cảm (như hủy đơn, xóa đơn), LUÔN nhắc nhở và hỏi xác nhận trước khi thực hiện.
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
  public async executeTool(toolName: string, args: any): Promise<ToolExecutionResult> {
    try {
      switch (toolName) {
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
        text: `Đã xảy ra lỗi khi tìm kiếm thông tin sản phẩm.`,
        error: err.message,
      };
    }
  }

  /**
   * Phân tích ý định thông minh để gọi tool khi ở chế độ fallback hoặc API không hỗ trợ Function Calling
   */
  public detectIntent(message: string): { toolName: string | null; args: any } {
    const lower = message.toLowerCase().trim();

    // 1. Ý định so sánh sản phẩm
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

    // 2. Ý định xem chi tiết sản phẩm cụ thể
    if (lower.includes('chi tiết') || lower.includes('thông số') || lower.includes('cấu hình')) {
      let query = message.replace(/(xem|chi tiết|thông số|cấu hình|của|sản phẩm)/gi, '').trim();
      return { toolName: 'get_product_details', args: { product_id: query || 'iphone-15-pro-max-256gb' } };
    }

    // 3. Ý định tìm kiếm / mua sắm sản phẩm
    const productKeywords = [
      'tìm', 'kiếm', 'mua', 'giá', 'bán', 'điện thoại', 'smartphone', 'laptop', 'tai nghe',
      'iphone', 'samsung', 'macbook', 'sony', 'chuột', 'bàn phím', 'màn hình', 'đồng hồ',
      'loa', 'áo', 'quần', 'giày', 'tư vấn', 'gợi ý', 'dưới', 'triệu'
    ];
    if (productKeywords.some((kw) => lower.includes(kw))) {
      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      // Trích xuất giá (ví dụ: "dưới 20 triệu", "tầm 15 triệu", "từ 10 đến 25 triệu")
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

      // Làm sạch query tìm kiếm
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
   * Định nghĩa Gemini Function Declarations
   */
  private getGeminiTools() {
    return [
      {
        functionDeclarations: [
          {
            name: 'search_products',
            description: 'Tìm kiếm sản phẩm trên sàn thương mại điện tử theo từ khóa, danh mục, khoảng giá hoặc sắp xếp.',
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
            description: 'So sánh chi tiết 2 hoặc nhiều sản phẩm dựa trên thông số kỹ thuật, giá cả và đưa ra gợi ý.',
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
    const { messages, contextChunks, onChunk, onMetadata } = options;
    const systemPrompt = this.buildSystemPrompt(contextChunks);
    const lastMessage = messages[messages.length - 1]?.content || '';
    let fullResponse = '';
    let executedMetadata: ToolMetadataPayload | null = null;
    const toolCallsRecord: Array<{ name: string; args: any; result: any }> = [];

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
          // Kiểm tra xem Gemini có yêu cầu gọi Tool Calling không
          const functionCalls = chunk.functionCalls();
          if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
              const toolResult = await this.executeTool(call.name, call.args);
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
    return await this.fallbackStreamWithTools(lastMessage, contextChunks, onChunk, onMetadata);
  }

  /**
   * Fallback trả lời thông minh kết hợp gọi Tool khi không có LLM API key
   */
  private async fallbackStreamWithTools(
    userMessage: string,
    contextChunks: RagChunkResult[],
    onChunk: (chunk: string) => void,
    onMetadata?: (metadata: ToolMetadataPayload) => void
  ): Promise<OrchestratorResult> {
    const { toolName, args } = this.detectIntent(userMessage);
    let fullResponse = '';
    let metadata: ToolMetadataPayload | null = null;
    const toolCallsRecord: any[] = [];

    // Nếu phát hiện ý định liên quan đến sản phẩm -> Gọi Tool Catalog
    if (toolName) {
      const toolResult = await this.executeTool(toolName, args);
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
      fullResponse += `- 🔍 Tìm kiếm sản phẩm phù hợp với nhu cầu & ngân sách (ví dụ: *"Tìm điện thoại dưới 30 triệu"*, *"Laptop văn phòng mỏng nhẹ"*).\n`;
      fullResponse += `- ⚖️ So sánh chi tiết cấu hình và giá bán giữa các sản phẩm (ví dụ: *"So sánh iPhone 15 Pro Max và Galaxy S24 Ultra"*).\n`;
      fullResponse += `- 📄 Tra cứu chính sách đổi trả, bảo hành, phí vận chuyển toàn quốc.\n\n`;
      fullResponse += `Bạn đang quan tâm đến sản phẩm hoặc cần giải đáp thông tin nào ạ?`;
    }

    // Giả lập stream chữ chạy mượt mà
    const words = fullResponse.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise((r) => setTimeout(r, 20));
    }

    return {
      fullText: fullResponse,
      metadata,
      toolCalls: toolCallsRecord,
    };
  }
}

export const llmOrchestrator = new LlmOrchestrator();
