import { LLMClient } from "./llm.client";
import {
  SentimentAnalysisSchema,
  SentimentAnalysisResult
} from "../schemas/sentiment.schema";

export class SentimentService {
  private static readonly SYSTEM_INSTRUCTION = `Bạn là hệ thống phân tích cảm xúc và phân loại ticket chuyên nghiệp cho Sàn Thương Mại Điện Tử.
Nhiệm vụ của bạn là phân tích tiêu đề và nội dung khiếu nại/yêu cầu hỗ trợ của khách hàng và trả về đúng một đối tượng JSON hợp lệ theo cấu trúc sau:

{
  "sentiment": "ANGRY" | "FRUSTRATED" | "DISAPPOINTED" | "NEUTRAL",
  "sentiment_score": <số nguyên từ 0 đến 100, 100 là cực kỳ bức xúc/tiêu cực>,
  "priority": "P1" | "P2" | "P3" | "P4",
  "category": "REFUND" | "WARRANTY" | "SHIPPING" | "PAYMENT" | "PRODUCT" | "ORDER" | "OTHER",
  "summary": "<Tóm tắt vấn đề cốt lõi trong 1-2 câu tiếng Việt>",
  "key_issues": ["<vấn đề 1>", "<vấn đề 2>"]
}

Quy tắc phân loại:
1. sentiment:
   - "ANGRY": Khách hàng dùng lời lẽ bức xúc, đe dọa khiếu nại, tố cáo lừa đảo, cực kỳ tức giận.
   - "FRUSTRATED": Khách hàng bực bội do chờ đợi lâu, quy trình rắc rối, lặp đi lặp lại lỗi.
   - "DISAPPOINTED": Khách hàng buồn phiền, thất vọng về chất lượng hàng/dịch vụ so với kỳ vọng.
   - "NEUTRAL": Khách hàng hỏi thông tin bình thường, thắc mắc thủ tục, thái độ ôn hòa.

2. Quy tắc phân hạng priority & sentiment_score:
   - P1 (Critical): sentiment_score >= 80 HOẶC sự cố liên quan đến tiền bạc (REFUND, PAYMENT trừ tiền sai) giá trị lớn, dọa kiện, tố cáo lừa đảo.
   - P2 (High): sentiment_score từ 60 đến 79 HOẶC đơn hàng trễ hẹn nghiêm trọng (SHIPPING), bảo hành sản phẩm lỗi đắt tiền (WARRANTY).
   - P3 (Medium): sentiment_score từ 40 đến 59, các vấn đề hỗ trợ thông thường cần can thiệp.
   - P4 (Low): sentiment_score < 40, câu hỏi thăm dò thông tin chung, thắc mắc chính sách đơn giản.

3. category:
   - "REFUND": Yêu cầu trả hàng hoàn tiền.
   - "WARRANTY": Bảo hành sản phẩm, sửa chữa kỹ thuật.
   - "SHIPPING": Giao hàng chậm, shipper thái độ, thất lạc kiện hàng.
   - "PAYMENT": Lỗi thanh toán, trừ tiền thẻ 2 lần, không nhận được tiền hoàn.
   - "PRODUCT": Hàng vỡ hỏng, sai mô tả, hàng giả/nhái, thiếu phụ kiện.
   - "ORDER": Hủy đơn hàng, thay đổi địa chỉ nhận hàng, sai thông tin đơn.
   - "OTHER": Các vấn đề khác ngoài danh mục trên.

CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG KÈM THEO BẤT KỲ VĂN BẢN HAY GIẢI THÍCH NÀO NGOÀI JSON.`;

  /**
   * Phân tích cảm xúc từ Subject và Content của ticket
   */
  static async analyze(
    subject: string,
    content: string
  ): Promise<SentimentAnalysisResult> {
    const userPrompt = `Hãy phân tích nội dung ticket sau đây:
TIÊU ĐỀ:
"""
${subject.trim()}
"""

NỘI DUNG CHI TIẾT:
"""
${content.trim()}
"""`;

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
      const validated = SentimentAnalysisSchema.parse(parsed);
      return validated;
    } catch (parseError: any) {
      console.error(
        "[SentimentService] JSON parse / validation error:",
        parseError,
        "Raw LLM output was:",
        rawResponse
      );
      throw new Error(`Kết quả từ LLM không đúng định dạng: ${parseError.message}`);
    }
  }
}

