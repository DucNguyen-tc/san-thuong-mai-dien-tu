import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env';
import { RagChunkResult } from './rag.service';

export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system';
  content: string;
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
    let basePrompt = `Bạn là Trợ lý mua sắm AI thông minh của Sàn Thương Mại Điện Tử.
Hãy tuân thủ nghiêm ngặt các quy tắc sau:

1. TUYỆT ĐỐI KHÔNG được bịa đặt thông tin về chính sách, quy định, điều khoản của sàn. Chỉ trả lời dựa trên nội dung Context được cung cấp bên dưới.
2. Nếu Context không chứa thông tin liên quan đến câu hỏi chính sách, hãy trả lời:
   "Xin lỗi, tôi không tìm thấy thông tin về vấn đề này trong quy chế của sàn. Bạn vui lòng liên hệ Hotline CSKH: 1900-6868 hoặc gửi yêu cầu hỗ trợ để được giải đáp chi tiết hơn nhé!"
3. Khi trả lời về sản phẩm, giá bán, luôn phản hồi đúng sự thật.
4. Đối với các hành động nhạy cảm (như hủy đơn, xóa đơn), LUÔN nhắc nhở và hỏi xác nhận trước khi thực hiện.
5. Nếu khách hàng chưa đăng nhập mà yêu cầu xem giỏ hàng hoặc lịch sử đơn hàng, hãy nhắc khách đăng nhập trước.
6. Phản hồi bằng Tiếng Việt, lịch sự, thân thiện, ngắn gọn và định dạng Markdown rõ ràng.`;

    if (contextChunks && contextChunks.length > 0) {
      basePrompt += `\n\n--- DƯỚI ĐÂY LÀ CÁC ĐIỀU KHOẢN CHÍNH SÁCH CHÍNH THỨC CỦA SÀN (HÃY TRẢ LỜI DỰA TRÊN ĐÂY): ---\n`;
      contextChunks.forEach((chunk, index) => {
        basePrompt += `\n[Tài liệu ${index + 1} - ${chunk.document_title} (Độ khớp: ${chunk.score})]:\n${chunk.content}\n`;
      });
    }

    return basePrompt;
  }

  /**
   * Stream câu trả lời của AI theo thời gian thực (Server-Sent Events)
   */
  async streamResponse(
    messages: ChatMessageParam[],
    contextChunks: RagChunkResult[],
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(contextChunks);
    let fullResponse = '';

    // 1. Thử dùng Google Gemini SDK (Gemini 1.5 Flash)
    if (this.geminiClient && env.GEMINI_API_KEY) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });

        // Chuyển đổi lịch sử chat cho Gemini
        const history = messages.slice(0, -1).map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const lastMessage = messages[messages.length - 1]?.content || '';
        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMessage);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            onChunk(text);
          }
        }
        return fullResponse;
      } catch (err: any) {
        console.warn('[LLM Orchestrator] Gemini streaming failed, trying OpenAI:', err.message);
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
        return fullResponse;
      } catch (err: any) {
        console.warn('[LLM Orchestrator] OpenAI streaming failed:', err.message);
      }
    }

    // 3. Fallback Smart Response (khi chưa cấu hình API Key)
    return this.fallbackStream(messages[messages.length - 1]?.content || '', contextChunks, onChunk);
  }

  /**
   * Fallback trả lời thông minh dựa trên RAG context khi không có API key
   */
  private async fallbackStream(
    userMessage: string,
    contextChunks: RagChunkResult[],
    onChunk: (chunk: string) => void
  ): Promise<string> {
    let reply = '';
    if (contextChunks.length > 0) {
      reply = `Dạ, theo chính sách chính thức của sàn (${contextChunks[0].document_title}):\n\n`;
      reply += contextChunks[0].content + '\n\n';
      reply += 'Nếu bạn cần thêm sự trợ giúp nào khác, hãy cho mình biết nhé!';
    } else {
      reply = `Chào bạn! Tôi là Trợ lý Mua Sắm AI. Tôi đã nhận được câu hỏi: "${userMessage}".\n`;
      reply += `Bạn có thể hỏi tôi về thông tin sản phẩm, kiểm tra đơn hàng hoặc tra cứu các chính sách đổi trả, bảo hành nhé!`;
    }

    const words = reply.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise((r) => setTimeout(r, 25));
    }

    return reply;
  }
}

export const llmOrchestrator = new LlmOrchestrator();

