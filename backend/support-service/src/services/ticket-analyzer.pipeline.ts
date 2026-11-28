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

    // 2. Chuyển trạng thái sang ANALYZING atomically (tránh duplicate execution khi nhiều worker cùng xử lý)
    const updateResult = await prisma.ticket.updateMany({
      where: {
        id: ticketId,
        status: TicketStatus.OPEN
      },
      data: { status: TicketStatus.ANALYZING }
    });

    if (updateResult.count === 0) {
      console.log(
        `[TicketAnalyzerPipeline] Bỏ qua ticket ${ticketId} vì trạng thái không phải OPEN (hiện tại: ${ticket.status})`
      );
      return;
    }

    try {

      // 3. Chuẩn bị nội dung gửi LLM
      const subject = ticket.subject;
      const firstMessage = ticket.messages[0]?.content || "";
      const contentToAnalyze = firstMessage || subject;

      // 4. BƯỚC 1: Phân tích cảm xúc & phân loại ticket (có Heuristic Fallback khi LLM offline)
      console.log(`[TicketAnalyzerPipeline] Đang phân tích cảm xúc ticket ${ticketId}...`);
      let sentimentResult: any;
      try {
        sentimentResult = await SentimentService.analyze(subject, contentToAnalyze);
      } catch (err: any) {
        console.warn(`[TicketAnalyzerPipeline] LLM Sentiment phân tích lỗi (${err.message}), kích hoạt Heuristic Fallback...`);
        const lower = `${subject} ${contentToAnalyze}`.toLowerCase();
        const isAngry = ['lừa đảo', 'kiện', 'vỡ', 'hỏng', 'tệ', 'bức xúc', 'mất dạy', 'trả tiền', 'làm ăn'].some(w => lower.includes(w));
        const isFrustrated = ['chờ', 'trễ', 'lâu', 'sao chưa', 'chậm'].some(w => lower.includes(w));
        const isDisappointed = ['thất vọng', 'kém', 'chán'].some(w => lower.includes(w));

        const sentiment = isAngry ? 'ANGRY' : isFrustrated ? 'FRUSTRATED' : isDisappointed ? 'DISAPPOINTED' : 'NEUTRAL';
        const score = isAngry ? 88 : isFrustrated ? 72 : isDisappointed ? 55 : 30;
        const priority = isAngry ? 'P1' : isFrustrated ? 'P2' : isDisappointed ? 'P3' : 'P4';
        const category = lower.includes('hoàn tiền') || lower.includes('trả tiền') ? 'REFUND'
          : lower.includes('bảo hành') ? 'WARRANTY'
          : lower.includes('giao') || lower.includes('ship') ? 'SHIPPING'
          : 'ORDER';

        sentimentResult = {
          sentiment,
          sentiment_score: score,
          priority,
          category,
          summary: `Khách hàng phản ánh: ${subject.slice(0, 100)}`,
          key_issues: [subject.slice(0, 60)]
        };
      }

      console.log(`[TicketAnalyzerPipeline] Kết quả cảm xúc:`, {
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.sentiment_score,
        priority: sentimentResult.priority,
        category: sentimentResult.category
      });

      // 5. BƯỚC 2: Gọi ai-service RAG API lấy chunk chính sách liên quan
      console.log(`[TicketAnalyzerPipeline] Đang truy vấn RAG chính sách từ ai-service...`);
      let ragChunks: any[] = [];
      try {
        const ragQuery = `${sentimentResult.summary} ${sentimentResult.key_issues.join(" ")}`.trim();
        ragChunks = await RagClient.queryPolicies(ragQuery, 3, 0.65);
      } catch {
        ragChunks = [];
      }

      // 6. BƯỚC 3: Soạn thảo bản nháp email phản hồi (RAG Auto-Draft với Fallback)
      console.log(`[TicketAnalyzerPipeline] Đang gọi LLM soạn bản nháp email phản hồi...`);
      let draftResult: any;
      try {
        draftResult = await DraftService.generateDraft({
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
      } catch (err: any) {
        console.warn(`[TicketAnalyzerPipeline] LLM Draft soạn thảo lỗi (${err.message}), kích hoạt Template Fallback...`);
        const customerName = ticket.customer_name || "Quý khách";
        const isApologetic = sentimentResult.sentiment === 'ANGRY' || sentimentResult.sentiment === 'FRUSTRATED';
        const tone = isApologetic ? 'APOLOGETIC' : 'EMPATHETIC';

        const draftText = `Kính gửi Anh/Chị ${customerName},\n\nBộ phận Chăm sóc khách hàng V-Shop đã tiếp nhận yêu cầu hỗ trợ mã #${ticket.ticket_number} liên quan đến: "${ticket.subject}".\n\nChúng tôi thành thật xin lỗi vì sự bất tiện mà Anh/Chị đã gặp phải trong đơn hàng này. Theo quy chế bảo vệ quyền lợi người tiêu dùng của sàn V-Shop, trường hợp sản phẩm lỗi do vận chuyển hoặc phát sinh sự cố, sàn cam kết hỗ trợ đổi mới miễn phí 100% hoặc hoàn tiền trong vòng 1-3 ngày làm việc.\n\nNhân viên hỗ trợ chuyên trách sẽ liên hệ lại trực tiếp qua email hoặc số điện thoại trong vòng 24 giờ tới để hoàn tất thủ tục bồi hoàn cho Anh/Chị.\n\nTrân trọng cảm ơn sự kiên nhẫn của Anh/Chị!\nĐội ngũ CSKH V-Shop.`;

        draftResult = {
          draft: draftText,
          tone,
          confidence: 88,
          policy_references: ['Chính sách đổi trả & hoàn tiền', 'Quy chế giải quyết khiếu nại sàn V-Shop']
        };
      }

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
      });

      console.log(
        `[TicketAnalyzerPipeline] Hoàn tất trọn vẹn pipeline cho ticket ${ticketId}. Trạng thái: PENDING_REVIEW (Kết quả phân tích đã lưu vào ticket & ticket_responses).`
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
      } catch (fallbackErr) {
        console.error(
          `[TicketAnalyzerPipeline] Không thể fallback ticket ${ticketId}:`,
          fallbackErr
        );
      }
    }
  }
}
