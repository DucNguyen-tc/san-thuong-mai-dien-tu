import { prisma } from "../config/prisma";
import {
  TicketStatus,
  TicketSentiment,
  TicketPriority,
  SenderType,
  ReviewStatus
} from "@prisma/client";
import { SentimentService } from "./sentiment.service";
import { RagClient } from "./rag.client";
import { DraftService } from "./draft.service";

export class TicketAnalyzerPipeline {
  /**
   * Xử lý trọn vẹn luồng tự động:
   * 1. OPEN -> ANALYZING
   * 2. Gọi LLM Phân tích cảm xúc (Sentiment, Score, Priority, Category, Summary)
   * 3. Gọi ai-service RAG API lấy các chunk chính sách liên quan
   * 4. Gọi LLM Soạn thảo email phản hồi mẫu (Draft, Tone, Confidence, Policy References)
   * 5. Lưu draft vào ticket_responses
   * 6. Chuyển trạng thái sang PENDING_REVIEW
   * Nếu lỗi -> Fallback an toàn về OPEN
   */
  static async processTicketAnalysis(ticketId: string): Promise<void> {
    console.log(`[TicketAnalyzerPipeline] Bắt đầu xử lý pipeline cho ticket: ${ticketId}`);

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

      // 4. BƯỚC 1: Phân tích cảm xúc & phân loại ticket
      console.log(`[TicketAnalyzerPipeline] Đang phân tích cảm xúc ticket ${ticketId}...`);
      const sentimentResult = await SentimentService.analyze(subject, contentToAnalyze);

      console.log(`[TicketAnalyzerPipeline] Kết quả cảm xúc:`, {
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.sentiment_score,
        priority: sentimentResult.priority,
        category: sentimentResult.category
      });

      // 5. BƯỚC 2: Gọi ai-service RAG API lấy chunk chính sách liên quan
      console.log(`[TicketAnalyzerPipeline] Đang truy vấn RAG chính sách từ ai-service...`);
      const ragQuery = `${sentimentResult.summary} ${sentimentResult.key_issues.join(" ")}`.trim();
      const ragChunks = await RagClient.queryPolicies(ragQuery, 3, 0.65);

      // 6. BƯỚC 3: Soạn thảo bản nháp email phản hồi (RAG Auto-Draft)
      console.log(`[TicketAnalyzerPipeline] Đang gọi LLM soạn bản nháp email phản hồi...`);
      const draftResult = await DraftService.generateDraft({
        customerName: ticket.customer_name || "Khách hàng",
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        content: contentToAnalyze,
        sentiment: sentimentResult.sentiment,
        sentimentScore: sentimentResult.sentiment_score,
        summary: sentimentResult.summary,
        keyIssues: sentimentResult.key_issues,
        ragChunks
      });

      console.log(`[TicketAnalyzerPipeline] Soạn draft thành công:`, {
        tone: draftResult.tone,
        confidence: draftResult.confidence,
        references: draftResult.policy_references
      });

      // 7. BƯỚC 4: Transaction lưu kết quả phân tích & bản nháp vào Database
      await prisma.$transaction(async (tx) => {
        // Cập nhật thông tin phân tích vào bảng tickets
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            sentiment: sentimentResult.sentiment as TicketSentiment,
            sentiment_score: sentimentResult.sentiment_score,
            priority: sentimentResult.priority as TicketPriority,
            ai_category: sentimentResult.category,
            ai_summary: sentimentResult.summary,
            status: TicketStatus.PENDING_REVIEW
          }
        });

        // Lưu bản nháp vào bảng ticket_responses
        await tx.ticketResponse.create({
          data: {
            ticket_id: ticketId,
            ai_draft: draftResult.draft,
            rag_chunks_used: ragChunks as any,
            ai_tone: draftResult.tone,
            ai_confidence: draftResult.confidence,
            review_status: ReviewStatus.PENDING
          }
        });

        // Ghi lại tin nhắn hệ thống ghi nhận kết quả phân tích & draft
        await tx.ticketMessage.create({
          data: {
            ticket_id: ticketId,
            sender_type: SenderType.SYSTEM,
            content: `[AI Sentiment Analyzer] Phân tích hoàn tất: ${sentimentResult.sentiment} (Điểm: ${sentimentResult.sentiment_score}/100) | Ưu tiên: ${sentimentResult.priority} | Danh mục: ${sentimentResult.category}\nTóm tắt: ${sentimentResult.summary}`
          }
        });

        await tx.ticketMessage.create({
          data: {
            ticket_id: ticketId,
            sender_type: SenderType.SYSTEM,
            content: `[RAG Auto-Draft] Đã tạo nháp email phản hồi dựa trên ${ragChunks.length} chunk chính sách (Độ tự tin: ${draftResult.confidence}%, Tone: ${draftResult.tone}). Trạng thái: Chờ nhân viên CSKH duyệt.`
          }
        });
      });

      console.log(
        `[TicketAnalyzerPipeline] Hoàn tất trọn vẹn pipeline cho ticket ${ticketId}. Trạng thái: PENDING_REVIEW.`
      );
    } catch (error: any) {
      console.error(
        `[TicketAnalyzerPipeline] Lỗi trong pipeline xử lý ticket ${ticketId}:`,
        error?.message || error
      );

      // 8. Fallback an toàn: Rollback trạng thái về OPEN theo thiết kế mục 2.3 trong ticket.md
      try {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.OPEN }
        });

        await prisma.ticketMessage.create({
          data: {
            ticket_id: ticketId,
            sender_type: SenderType.SYSTEM,
            content: `[AI Pipeline Cảnh báo] Xử lý tự động gặp sự cố (${error?.message || "Lỗi không xác định"}). Trạng thái ticket được đưa về OPEN để nhân viên CSKH xử lý thủ công.`
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
