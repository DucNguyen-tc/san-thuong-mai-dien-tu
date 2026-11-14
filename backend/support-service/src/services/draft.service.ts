import { LLMClient } from "./llm.client";
import { RagChunk } from "./rag.client";
import { DraftResponseSchema, DraftResponseResult } from "../schemas/draft.schema";

export interface GenerateDraftInput {
  customerName: string;
  ticketNumber: string;
  subject: string;
  content: string;
  sentiment: string;
  sentimentScore: number;
  summary: string;
  keyIssues: string[];
  ragChunks: RagChunk[];
  revisionInstruction?: string;
}

export class DraftService {
  private static readonly SYSTEM_INSTRUCTION = `Bạn là nhân viên CSKH chuyên nghiệp, tận tâm của Sàn Thương Mại Điện Tử.
Nhiệm vụ của bạn là soạn bản nháp (draft) email phản hồi khiếu nại/yêu cầu của khách hàng dựa trên thông tin cảm xúc và các chính sách của sàn được cung cấp.

BẮT BUỘC TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON VỚI CẤU TRÚC SAU:
{
  "draft": "<Nội dung email hoàn chỉnh, lịch sự, đúng định dạng, chia đoạn rõ ràng>",
  "tone": "EMPATHETIC" | "APOLOGETIC" | "INFORMATIVE",
  "confidence": <Số nguyên 0-100 đánh giá mức độ tự tin và đầy đủ thông tin để trả lời>,
  "policy_references": ["<Tên hoặc điều khoản chính sách đã tham chiếu trích dẫn>"]
}

QUY TẮC SOẠN EMAIL:
1. Mở đầu: Chào khách hàng trang trọng (Kính gửi Anh/Chị {customer_name},...).
2. Thấu hiểu & Xin lỗi:
   - Nếu sentiment là ANGRY hoặc FRUSTRATED (sentiment_score >= 60): Mở đầu bằng lời xin lỗi chân thành về trải nghiệm không tốt, bày tỏ sự thấu cảm sâu sắc. Chọn tone: "APOLOGETIC".
   - Nếu sentiment là DISAPPOINTED: Thể hiện sự đồng cảm, cam kết giải quyết. Chọn tone: "EMPATHETIC".
   - Nếu sentiment là NEUTRAL: Cung cấp thông tin rành mạch, hỗ trợ nhiệt tình. Chọn tone: "INFORMATIVE".
3. Trích dẫn chính sách:
   - Sử dụng các điều khoản trong phần "Chính sách liên quan (từ Knowledge Base)" để giải thích quyền lợi và phương án cho khách.
   - Nêu rõ thời hạn xử lý cụ thể (VD: hoàn tiền trong 3-5 ngày làm việc).
4. Xử lý thiếu thông tin:
   - Nếu chính sách không đủ hoặc cần kiểm tra thực tế kho/vận chuyển, hãy ghi rõ trong email: "[CẦN KIỂM TRA THÊM: <nội dung cần nhân viên xác minh>]" và đặt confidence < 50 để nhân viên CSKH chú ý kiểm tra lại.
   - Nếu thông tin chính sách đầy đủ, tự tin: đặt confidence từ 80 đến 100.
5. Kết thúc: Nêu rõ kênh liên hệ hỗ trợ bổ sung (Hotline 1900-xxxx hoặc phản hồi email này), lời chào trân trọng từ "Đội ngũ CSKH - Sàn Thương Mại Điện Tử".
6. Độ dài: Khoảng 150 - 300 từ tiếng Việt.

CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CHỨA BẤT KỲ VĂN BẢN NGOÀI NÀO.`;

  /**
   * Soạn thảo email phản hồi tự động
   */
  static async generateDraft(input: GenerateDraftInput): Promise<DraftResponseResult> {
    const formattedChunks =
      input.ragChunks && input.ragChunks.length > 0
        ? input.ragChunks
            .map(
              (c, index) =>
                `--- Chunk ${index + 1} (${c.document_title || "Chính sách"}) [Score: ${c.score || "N/A"}]:\n${c.content}`
            )
            .join("\n\n")
        : "Không tìm thấy đoạn chính sách cụ thể phù hợp trong hệ thống Knowledge Base.";

    const feedbackSection = input.revisionInstruction
      ? `\n## CHỈ DẪN ĐIỀU CHỈNH TỪ NHÂN VIÊN CSKH (BẮT BUỘC TUÂN THỦ CAO NHẤT):
Bản nháp trước đó chưa đạt yêu cầu. Nhân viên CSKH đưa ra yêu cầu chỉnh sửa cụ thể:
"${input.revisionInstruction}"
Hãy điều chỉnh lại nội dung câu trả lời, giải pháp và giọng điệu để phản ánh chính xác yêu cầu này.\n`
      : "";

    const userPrompt = `Hãy soạn email phản hồi cho ticket của khách hàng dựa trên các thông tin sau:

## Thông tin khách hàng & Ticket
- Tên khách hàng: ${input.customerName || "Khách hàng"}
- Mã ticket: ${input.ticketNumber}
- Tiêu đề ticket: ${input.subject}
- Nội dung tin nhắn gốc của khách:
"""
${input.content}
"""

## Phân tích cảm xúc
- Mức độ cảm xúc: ${input.sentiment}
- Điểm tiêu cực: ${input.sentimentScore}/100
- Tóm tắt vấn đề: ${input.summary}
- Các vấn đề cốt lõi: ${input.keyIssues.join(", ") || "Không có"}

## Chính sách liên quan (từ Knowledge Base)
${formattedChunks}
${feedbackSection}`;

    const rawResponse = await LLMClient.generateStructuredResponse(
      userPrompt,
      this.SYSTEM_INSTRUCTION
    );

    // Làm sạch Markdown backticks nếu có
    let cleanJson = rawResponse.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(cleanJson);
      const validated = DraftResponseSchema.parse(parsed);
      return validated;
    } catch (parseError: any) {
      console.error(
        "[DraftService] Lỗi parse / validate JSON draft từ LLM:",
        parseError,
        "Raw output:",
        rawResponse
      );
      throw new Error(`Bản nháp sinh từ LLM không đúng định dạng schema: ${parseError.message}`);
    }
  }
}

