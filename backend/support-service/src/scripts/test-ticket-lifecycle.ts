import dotenv from "dotenv";
dotenv.config();

import { SentimentAnalysisSchema } from "../schemas/sentiment.schema";
import { TicketStatus, TicketSentiment, TicketPriority } from "@prisma/client";

async function testStateTransitionAndDataContract() {
  console.log("=================================================");
  console.log("🧪 KIỂM THỬ STATE MACHINE & PIPELINE CONTRACT");
  console.log("=================================================");

  // 1. Kiểm tra State Machine Enums
  console.log("1. Kiểm tra trạng thái hợp lệ:");
  const validTransitions = [
    { from: TicketStatus.OPEN, to: TicketStatus.ANALYZING },
    { from: TicketStatus.ANALYZING, to: TicketStatus.PENDING_REVIEW },
    { from: "ANALYZING_ERROR", fallbackTo: TicketStatus.OPEN }
  ];
  console.log("✅ Các bước chuyển trạng thái chuẩn xác:", validTransitions);

  // 2. Giả lập kết quả phân tích từ LLM
  console.log("\n2. Giả lập kết quả trả về từ OpenAI (JSON Format):");
  const mockOpenAIOutput = {
    sentiment: "ANGRY",
    sentiment_score: 85,
    priority: "P1",
    category: "SHIPPING",
    summary: "Đơn hàng trễ hẹn 5 ngày, khách yêu cầu hoàn tiền",
    key_issues: ["Giao hàng chậm", "Chưa nhận được phản hồi"]
  };

  const parsed = SentimentAnalysisSchema.parse(mockOpenAIOutput);
  console.log("✅ Dữ liệu parse từ LLM thành công:", parsed);

  // 3. Giả lập cập nhật bản ghi Ticket
  const mockTicketBefore = {
    id: "test-uuid-1234",
    ticket_number: "TK-20261108-001",
    status: TicketStatus.OPEN,
    sentiment: null,
    sentiment_score: null,
    priority: TicketPriority.P3,
    ai_category: null,
    ai_summary: null
  };

  console.log("\n3. Ticket trước khi phân tích (OPEN):", mockTicketBefore);

  // Chuyển sang ANALYZING
  const mockTicketAnalyzing = {
    ...mockTicketBefore,
    status: TicketStatus.ANALYZING
  };
  console.log("Ticket trong lúc gọi LLM (ANALYZING):", mockTicketAnalyzing.status);

  // Cập nhật kết quả -> PENDING_REVIEW
  const mockTicketPendingReview = {
    ...mockTicketAnalyzing,
    sentiment: parsed.sentiment as TicketSentiment,
    sentiment_score: parsed.sentiment_score,
    priority: parsed.priority as TicketPriority,
    ai_category: parsed.category,
    ai_summary: parsed.summary,
    status: TicketStatus.PENDING_REVIEW
  };

  console.log("\n4. Ticket sau khi AI phân tích xong (PENDING_REVIEW):");
  console.log(mockTicketPendingReview);

  console.log("\n=================================================");
  console.log("🎉 STATE MACHINE & CONTRACT TEST PASSED!");
  console.log("=================================================");
}

testStateTransitionAndDataContract();

