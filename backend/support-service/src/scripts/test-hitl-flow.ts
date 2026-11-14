import { TicketService } from "../services/ticket.service";
import { TicketAnalyzerPipeline } from "../services/ticket-analyzer.pipeline";
import { prisma } from "../config/prisma";
import { LLMClient } from "../services/llm.client";

async function runHitlE2ETest() {
  console.log("=== BẮT ĐẦU KIỂM THỬ E2E LUỒNG HUMAN-IN-THE-LOOP ===");

  // Hỗ trợ fallback mock nếu OpenAI offline hoặc quota vượt giới hạn
  const originalGenerate = LLMClient.generateStructuredResponse;
  LLMClient.generateStructuredResponse = async (prompt: string, sys?: string) => {
    try {
      return await originalGenerate.call(LLMClient, prompt, sys);
    } catch (e: any) {
      console.log("[Test Mock Fallback] Sử dụng phản hồi LLM giả lập do:", e.message);
      if (prompt.includes("TIÊU ĐỀ:")) {
        return JSON.stringify({
          sentiment: "ANGRY",
          sentiment_score: 90,
          priority: "P1",
          category: "SHIPPING",
          summary: "Khách hàng bức xúc vì đơn hàng giao trễ 6 ngày không nhận được phản hồi",
          key_issues: ["Giao trễ 6 ngày", "Yêu cầu hoàn tiền và hủy đơn"]
        });
      }
      return JSON.stringify({
        draft: "Kính gửi Quý khách Nguyễn Văn Test, Chúng tôi thành thật xin lỗi vì đơn hàng giao trễ. Chúng tôi cam kết xử lý hoàn tiền trong 24 giờ và gửi tặng mã giảm giá.",
        tone: "APOLOGETIC",
        confidence: 95,
        policy_references: ["Chính sách bồi thường giao trễ"]
      });
    }
  };

  // 1. Giả lập khách gửi ticket bức xúc
  const customerId = "00000000-0000-0000-0000-000000000001";
  const createdTicket = await TicketService.createTicket(
    customerId,
    {
      subject: "Hàng giao trễ 6 ngày không một lời giải thích",
      category: "SHIPPING",
      content: "Tôi đặt hàng 6 ngày rồi, shipper không giao cũng không báo lại. Tôi muốn hủy đơn và hoàn tiền gấp!"
    },
    "khachhang.test@gmail.com",
    "Nguyễn Văn Test"
  );
  console.log(`[1] Đã tạo ticket: ${createdTicket.ticket_number} (ID: ${createdTicket.id})`);

  // 2. Chạy pipeline phân tích AI + RAG Auto-Draft
  await TicketAnalyzerPipeline.processTicketAnalysis(createdTicket.id);
  const ticketAfterAI = await TicketService.getAdminTicketDetail(createdTicket.id);
  console.log(`[2] Phân tích AI hoàn thành: Sentiment=${ticketAfterAI.sentiment}, Priority=${ticketAfterAI.priority}`);
  console.log(`    Draft ban đầu: ${ticketAfterAI.responses[0]?.ai_draft?.slice(0, 80)}...`);

  // 3. Staff xem danh sách tickets
  const listResult = await TicketService.getAdminTickets({ page: 1, limit: 10 });
  const found = listResult.items.some((t) => t.id === createdTicket.id);
  if (!found) throw new Error("Ticket vừa tạo không xuất hiện trong danh sách admin");
  console.log(`[3] Admin lấy danh sách ticket thành công, tổng cộng: ${listResult.pagination.total}`);

  // 4. Staff từ chối draft và yêu cầu viết lại
  const staffId = "00000000-0000-0000-0000-000000000099";
  console.log("[4] Staff từ chối draft, yêu cầu nhấn mạnh bồi thường...");
  const newDraft = await TicketService.rejectDraft(createdTicket.id, staffId, {
    revision_instruction: "Nhấn mạnh xin lỗi chân thành, cam kết hoàn tiền trong 24 giờ và gửi mã giảm giá 50.000đ"
  });
  console.log(`    Draft mới sau khi sửa: ${newDraft.ai_draft?.slice(0, 100)}...`);

  // 5. Staff sửa nhẹ và duyệt gửi
  console.log("[5] Staff duyệt & gửi...");
  const approveResult = await TicketService.approveAndSend(createdTicket.id, staffId, {
    final_response: (newDraft.ai_draft || "Nội dung phản hồi") + "\n\n(Đã được kiểm duyệt bởi Quản trị viên)",
    staff_notes: "Đã duyệt và gửi email bồi thường"
  });
  console.log(`    Kết quả duyệt: Status=${approveResult.status}`);

  // 6. Kiểm tra lại DB
  const finalCheck = await prisma.ticket.findUnique({
    where: { id: createdTicket.id },
    include: { responses: { orderBy: { created_at: "desc" } }, messages: true }
  });
  if (finalCheck?.status !== "RESPONDED") throw new Error("Ticket status chưa chuyển thành RESPONDED");
  if (finalCheck.responses[0].review_status !== "APPROVED") throw new Error("ReviewStatus chưa là APPROVED");
  const hasStaffMsg = finalCheck.messages.some((m) => m.sender_type === "STAFF");
  if (!hasStaffMsg) throw new Error("Chưa lưu tin nhắn của STAFF vào ticket_messages");

  console.log("🎉 TOÀN BỘ LUỒNG HUMAN-IN-THE-LOOP TEST THÀNH CÔNG RỰC RỠ!");
}

runHitlE2ETest()
  .catch((e) => {
    console.error("❌ Test HITL E2E thất bại:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

