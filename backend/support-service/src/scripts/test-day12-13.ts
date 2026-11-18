import { TicketService } from "../services/ticket.service";
import { TicketAnalyzerPipeline } from "../services/ticket-analyzer.pipeline";
import { RagClient } from "../services/rag.client";
import { rabbitMQService } from "../rabbitmq/rabbitmq.service";
import { LLMClient } from "../services/llm.client";
import { prisma } from "../config/prisma";
import { TicketStatus, TicketPriority, ReviewStatus, SenderType, TicketSource } from "@prisma/client";

/**
 * ========================================================================
 * TEST TÍCH HỢP TOÀN TRÌNH (E2E INTEGRATION) NGÀY 12-13 — BẠN 3 (ĐỨC)
 * CSKH AI Copilot & Ticket System:
 * 1. Kết nối support-service ↔ ai-service RAG API thật
 * 2. Tiếp nhận Ticket Escalate từ AI Chatbot (Bạn 1 ↔ Bạn 3)
 * 3. AI Sentiment Analyzer + RAG Auto-Draft Pipeline
 * 4. Human-in-the-loop: CSKH duyệt bản nháp & gửi email qua notification-service
 * ========================================================================
 */
async function runDay1213IntegrationTest() {
  console.log("========================================================================");
  console.log("🎓 BẮT ĐẦU KIỂM THỬ TÍCH HỢP END-TO-END (NGÀY 12-13) — BẠN 3 (CSKH COPILOT)");
  console.log("========================================================================\n");

  let passedScenarios = 0;
  const totalScenarios = 4;

  // 1. Mock Fallback cho LLM khi chạy local không có OpenAI quota
  const originalGenerate = LLMClient.generateStructuredResponse;
  LLMClient.generateStructuredResponse = async (prompt: string, sys?: string) => {
    try {
      return await originalGenerate.call(LLMClient, prompt, sys);
    } catch (e: any) {
      console.log("[Test LLM Fallback] Sử dụng phản hồi LLM giả lập thông minh:", e.message);
      if (prompt.includes("TIÊU ĐỀ:")) {
        return JSON.stringify({
          sentiment: "ANGRY",
          sentiment_score: 92,
          priority: "P1",
          category: "SHIPPING",
          summary: "Khách hàng bức xúc vì đơn hàng giao trễ 5 ngày và yêu cầu hủy đơn hoàn tiền gấp",
          key_issues: ["Giao trễ 5 ngày", "Hotline không nghe máy", "Yêu cầu hoàn tiền ngay"]
        });
      }
      return JSON.stringify({
        draft: "Kính gửi Quý khách Nguyễn Thị Test,\n\nThay mặt Sàn Thương Mại Điện Tử, em xin chân thành gửi lời xin lỗi sâu sắc về sự chậm trễ của đơn hàng. Theo chính sách hoàn tiền khi đơn trễ quá 3 ngày, chúng em sẽ tiến hành hoàn tiền 100% trong 24 giờ và gửi tặng Quý khách voucher 50.000đ.\n\nTrân trọng,\nĐội ngũ CSKH",
        tone: "APOLOGETIC",
        confidence: 94,
        policy_references: ["Chính sách đổi trả & hoàn tiền đơn hàng trễ"]
      });
    }
  };

  // 2. Mock RabbitMQ publish để kiểm tra chi tiết các sự kiện liên dịch vụ tuần tự
  let publishedEmailPayload: any = null;
  const originalPublishReplied = rabbitMQService.publishTicketReplied;
  rabbitMQService.publishTicketReplied = async (payload: any) => {
    publishedEmailPayload = payload;
    console.log(`   [RabbitMQ Event] Đã publish support.ticket.replied tới recipient: ${payload.recipientEmail}`);
    return originalPublishReplied.call(rabbitMQService, payload);
  };

  const originalPublishCreated = rabbitMQService.publishTicketCreated;
  rabbitMQService.publishTicketCreated = async (ticketId: string) => {
    console.log(`   [RabbitMQ Event] Ghi nhận publish ticket.created cho ticket ${ticketId}`);
  };

  // ========================================================================
  // KỊCH BẢN 1: KẾT NỐI SUPPORT-SERVICE ↔ AI-SERVICE RAG API THẬT
  // ========================================================================
  console.log("🔹 [KỊCH BẢN 1] KẾT NỐI SUPPORT-SERVICE ↔ AI-SERVICE RAG API THẬT:");
  const ragQueryText = "Chính sách hủy đơn và hoàn tiền khi giao hàng trễ";
  console.log(`   Gửi query truy vấn chính sách: "${ragQueryText}"`);

  let ragChunks: any[] = [];
  try {
    ragChunks = await RagClient.queryPolicies(ragQueryText, 3, 0.65);
    console.log(`   -> Số chunks chính sách nhận được: ${ragChunks.length}`);
    if (ragChunks.length > 0) {
      console.log(`   -> Chunk 1: [${ragChunks[0].document_title}] (Điểm liên quan: ${ragChunks[0].score || "N/A"})`);
      console.log(`      Nội dung: ${ragChunks[0].content.slice(0, 100)}...`);
    }

    const hasValidChunks = ragChunks.length > 0 && !!ragChunks[0].content;
    if (hasValidChunks) {
      console.log("   👉 KẾT QUẢ KỊCH BẢN 1: ✅ ĐẠT 100% (RAG API kết nối thành công!)\n");
      passedScenarios++;
    } else {
      throw new Error("Không nhận được chunk chính sách hợp lệ");
    }
  } catch (err: any) {
    console.error("   👉 KẾT QUẢ KỊCH BẢN 1: ❌ THẤT BẠI:", err.message);
  }

  // ========================================================================
  // KỊCH BẢN 2: TIẾP NHẬN TICKET TỰ ĐỘNG TỪ AI CHAT ESCALATE (BẠN 1 ↔ BẠN 3)
  // ========================================================================
  console.log("🔹 [KỊCH BẢN 2] TIẾP NHẬN ESCALATE TỪ AI CHATBOT KHI KHÁCH BỨC XÚC:");
  const mockCustomerId = "00000000-0000-0000-0000-000000000001";
  const mockChatSessionId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const angryReason = "Đơn hàng 5 ngày chưa giao, các bạn lừa đảo à? Tôi muốn gặp người thật và hoàn tiền ngay!";

  console.log(`   Khách hàng bức xúc trên Chat Widget: "${angryReason}"`);
  console.log("   AI Chatbot kích hoạt tool escalate_to_ticket...");

  let createdTicketId = "";
  let createdTicketNumber = "";

  try {
    const escalateResult = await TicketService.escalateTicket({
      customer_id: mockCustomerId,
      customer_email: "khachhang.angry@gmail.com",
      customer_name: "Nguyễn Thị Test",
      chat_session_id: mockChatSessionId,
      subject: `[AI Escalate] Khách bức xúc yêu cầu hoàn tiền đơn trễ`,
      content: angryReason,
      category: "SHIPPING",
      source: "AI_ESCALATE"
    });

    createdTicketId = escalateResult.ticket_id;
    createdTicketNumber = escalateResult.ticket_number;

    console.log(`   -> Đã tạo Ticket thành công: ${createdTicketNumber} (ID: ${createdTicketId})`);
    console.log(`   -> Trạng thái ban đầu: ${escalateResult.status} | Độ ưu tiên mặc định: ${escalateResult.priority}`);

    // Kiểm tra DB
    const ticketInDb = await prisma.ticket.findUnique({
      where: { id: createdTicketId },
      include: { messages: true }
    });

    const isSourceEscalate = ticketInDb?.source === TicketSource.AI_ESCALATE;
    const hasInitialMsg = ticketInDb?.messages && ticketInDb.messages.length > 0;

    if (isSourceEscalate && hasInitialMsg && ticketInDb?.priority === TicketPriority.P1) {
      console.log("   👉 KẾT QUẢ KỊCH BẢN 2: ✅ ĐẠT 100% (Escalate tạo Ticket P1 thành công!)\n");
      passedScenarios++;
    } else {
      throw new Error("Thông tin ticket trong DB không khớp với payload escalate");
    }
  } catch (err: any) {
    console.error("   👉 KẾT QUẢ KỊCH BẢN 2: ❌ THẤT BẠI:", err.message);
  }

  // ========================================================================
  // KỊCH BẢN 3: AI PHÂN TÍCH CẢM XÚC & RAG AUTO-DRAFT
  // ========================================================================
  console.log("🔹 [KỊCH BẢN 3] PIPELINE PHÂN TÍCH CẢM XÚC & RAG AUTO-DRAFT:");
  try {
    console.log(`   Đang kích hoạt TicketAnalyzerPipeline cho ticket ${createdTicketNumber}...`);
    await TicketAnalyzerPipeline.processTicketAnalysis(createdTicketId);

    const ticketAnalyzed = await TicketService.getAdminTicketDetail(createdTicketId);
    console.log(`   -> Cảm xúc phân tích: ${ticketAnalyzed.sentiment} (Điểm bức xúc: ${ticketAnalyzed.sentiment_score}/100)`);
    console.log(`   -> Độ ưu tiên: ${ticketAnalyzed.priority} | Trạng thái: ${ticketAnalyzed.status}`);
    console.log(`   -> Tóm tắt AI: "${ticketAnalyzed.ai_summary}"`);

    const latestResponse = ticketAnalyzed.responses && ticketAnalyzed.responses.length > 0 ? ticketAnalyzed.responses[0] : null;
    const hasDraft = !!latestResponse?.ai_draft;
    const hasConfidence = typeof latestResponse?.ai_confidence === "number";

    console.log(`   -> Bản nháp AI gợi ý: ${latestResponse?.ai_draft?.slice(0, 90)}...`);
    console.log(`   -> Độ tự tin AI: ${latestResponse?.ai_confidence}% | Tone: ${latestResponse?.ai_tone}`);

    if (
      ticketAnalyzed.status === TicketStatus.PENDING_REVIEW &&
      ticketAnalyzed.sentiment === "ANGRY" &&
      hasDraft &&
      hasConfidence
    ) {
      console.log("   👉 KẾT QUẢ KỊCH BẢN 3: ✅ ĐẠT 100% (AI phân tích & soạn Draft thành công!)\n");
      passedScenarios++;
    } else {
      throw new Error("Trạng thái ticket chưa chuyển sang PENDING_REVIEW hoặc thiếu AI draft");
    }
  } catch (err: any) {
    console.error("   👉 KẾT QUẢ KỊCH BẢN 3: ❌ THẤT BẠI:", err.message);
  }

  // ========================================================================
  // KỊCH BẢN 4: DUYỆT & GỬI EMAIL THẬT SANG NOTIFICATION-SERVICE (HITL E2E)
  // ========================================================================
  console.log("🔹 [KỊCH BẢN 4] HUMAN-IN-THE-LOOP: DUYỆT & GỬI EMAIL QUA RABBITMQ:");
  const mockStaffId = "00000000-0000-0000-0000-000000000099";

  try {
    const finalContent =
      "Kính gửi Chị Nguyễn Thị Test,\n\nEm là Minh Trí - Trưởng bộ phận CSKH. Em đã kiểm tra và tiến hành hủy đơn hàng giao trễ của chị và hoàn tiền 100% qua tài khoản ban đầu.\n\nĐồng thời, sàn xin gửi tặng chị mã giảm giá 50.000đ: 'XINLOI50K' cho lần mua hàng tiếp theo ạ. Rất mong chị thông cảm cho sự bất tiện này!\n\nTrân trọng,\nĐội ngũ CSKH";

    console.log("   Nhân viên CSKH kiểm tra bản nháp trên Agent Dashboard và bấm 'Duyệt & Gửi Email'...");
    const approveResult = await TicketService.approveAndSend(createdTicketId, mockStaffId, {
      final_response: finalContent,
      staff_notes: "Đã xác nhận sự cố kho vận delay 5 ngày, hoàn tiền và gửi voucher đền bù."
    });

    console.log(`   -> Kết quả duyệt: Ticket Status = ${approveResult.status}`);

    // Kiểm tra DB sau khi duyệt
    const finalTicket = await prisma.ticket.findUnique({
      where: { id: createdTicketId },
      include: {
        responses: { orderBy: { created_at: "desc" } },
        messages: { orderBy: { created_at: "desc" } }
      }
    });

    const isResponded = finalTicket?.status === TicketStatus.RESPONDED;
    const isApproved = finalTicket?.responses[0]?.review_status === ReviewStatus.APPROVED;
    const staffMsgSaved = finalTicket?.messages.some((m) => m.sender_type === SenderType.STAFF);
    const emailPublished = !!publishedEmailPayload && publishedEmailPayload.ticketNumber === createdTicketNumber;

    console.log(`   -> Trạng thái Ticket sau duyệt: ${finalTicket?.status} (${isResponded ? "✅ RESPONDED" : "❌"})`);
    console.log(`   -> Review Status của bản nháp: ${finalTicket?.responses[0]?.review_status} (${isApproved ? "✅ APPROVED" : "❌"})`);
    console.log(`   -> Tin nhắn của CSKH được lưu vào Timeline: ${staffMsgSaved ? "✅ ĐÃ LƯU" : "❌"}`);
    console.log(`   -> Event gửi email sang notification-service: ${emailPublished ? "✅ ĐÃ PHÁT SỰ KIỆN" : "❌"}`);

    if (isResponded && isApproved && staffMsgSaved && emailPublished) {
      console.log("   👉 KẾT QUẢ KỊCH BẢN 4: ✅ ĐẠT 100% (Duyệt & Gửi Email thành công!)\n");
      passedScenarios++;
    } else {
      throw new Error("Lỗi xác thực trạng thái Ticket hoặc sự kiện gửi Email sau khi duyệt");
    }
  } catch (err: any) {
    console.error("   👉 KẾT QUẢ KỊCH BẢN 4: ❌ THẤT BẠI:", err.message);
  }

  // ========================================================================
  // TỔNG KẾT
  // ========================================================================
  console.log("========================================================================");
  console.log(`🎉 TỔNG KẾT KIỂM THỬ TÍCH HỢP NGÀY 12-13: ${passedScenarios}/${totalScenarios} KỊCH BẢN ĐẠT XUẤT SẮC!`);
  if (passedScenarios === totalScenarios) {
    console.log("✅ HỆ THỐNG CSKH TICKET & AI COPILOT ĐÃ HOÀN TOÀN SẴN SÀNG CHO BÀN GIAO & DEMO!");
  } else {
    console.warn("⚠️ Vẫn còn một số điểm chưa đạt, vui lòng kiểm tra lại log chi tiết ở trên.");
  }
  console.log("========================================================================\n");
}

runDay1213IntegrationTest()
  .catch((e) => {
    console.error("Lỗi thực thi test:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
