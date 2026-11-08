import { prisma } from "../config/prisma";
import {
  TicketStatus,
  TicketSentiment,
  TicketPriority,
  SenderType
} from "@prisma/client";
import { SentimentService } from "./sentiment.service";

export class TicketAnalyzerPipeline {
  /**
   * Xử lý trọn vẹn luồng phân tích ticket:
   * OPEN -> ANALYZING -> Gọi LLM -> Lưu kết quả -> PENDING_REVIEW
   * Nếu lỗi -> Fallback về OPEN
   */
  static async processTicketAnalysis(ticketId: string): Promise<void> {
    console.log(`[TicketAnalyzerPipeline] Bắt đầu phân tích ticket: ${ticketId}`);

    // 1. Kiểm tra ticket tồn tại
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          where: { sender_type: SenderType.CUSTOMER },
          orderBy: { created_at: "asc" },
          take: 1
        }
      }
    });

    if (!ticket) {
      console.warn(`[TicketAnalyzerPipeline] Không tìm thấy ticket ${ticketId}`);
      return;
    }

    // Chỉ phân tích nếu ticket đang OPEN hoặc ANALYZING (tránh ghi đè nếu đã review/closed)
    if (
      ticket.status !== TicketStatus.OPEN &&
      ticket.status !== TicketStatus.ANALYZING
    ) {
      console.log(
        `[TicketAnalyzerPipeline] Bỏ qua ticket ${ticketId} vì trạng thái hiện tại là ${ticket.status}`
      );
      return;
    }

    try {
      // 2. Chuyển trạng thái sang ANALYZING
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.ANALYZING }
      });

      // 3. Chuẩn bị nội dung gửi LLM
      const subject = ticket.subject;
      const firstMessage = ticket.messages[0]?.content || "";
      const contentToAnalyze = firstMessage || subject;

      // 4. Gọi LLM Sentiment Service
      const result = await SentimentService.analyze(subject, contentToAnalyze);

      console.log(
        `[TicketAnalyzerPipeline] Kết quả phân tích ticket ${ticketId}:`,
        result
      );

      // 5. Cập nhật kết quả vào database & chuyển sang PENDING_REVIEW
      await prisma.$transaction(async (tx) => {
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            sentiment: result.sentiment as TicketSentiment,
            sentiment_score: result.sentiment_score,
            priority: result.priority as TicketPriority,
            ai_category: result.category,
            ai_summary: result.summary,
            status: TicketStatus.PENDING_REVIEW
          }
        });

        // Thêm tin nhắn hệ thống ghi nhận kết quả phân tích
        await tx.ticketMessage.create({
          data: {
            ticket_id: ticketId,
            sender_type: SenderType.SYSTEM,
            content: `[AI Analyzer] Phân tích hoàn tất: ${result.sentiment} (Điểm: ${result.sentiment_score}/100) | Ưu tiên: ${result.priority} | Danh mục: ${result.category}\nTóm tắt: ${result.summary}`
          }
        });
      });

      console.log(
        `[TicketAnalyzerPipeline] Ticket ${ticketId} đã hoàn tất phân tích và chuyển sang PENDING_REVIEW.`
      );
    } catch (error: any) {
      console.error(
        `[TicketAnalyzerPipeline] Lỗi khi phân tích ticket ${ticketId}:`,
        error?.message || error
      );

      // 6. Fallback an toàn: Rollback trạng thái về OPEN theo thiết kế mục 2.3 trong ticket.md
      try {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN }
        });

        await prisma.ticketMessage.create({
          data: {
            ticket_id: ticketId,
            sender_type: SenderType.SYSTEM,
            content: `[AI Analyzer Cảnh báo] Phân tích cảm xúc tự động gặp sự cố (${error?.message || "Lỗi không xác định"}). Trạng thái ticket được đưa về OPEN để nhân viên xử lý thủ công.`
          }
        });
      } catch (fallbackErr) {
        console.error(
          `[TicketAnalyzerPipeline] Không thể fallback ticket ${ticketId}:`,
          fallbackErr
        );
      }
    }
  }
}

