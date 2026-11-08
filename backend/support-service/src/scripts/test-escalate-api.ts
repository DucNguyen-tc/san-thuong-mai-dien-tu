import { escalateTicketSchema } from "../schemas/ticket.schema";

async function testEscalatePayload() {
  console.log("=================================================");
  console.log("🧪 KIỂM THỬ ESCALATE API PAYLOAD & DATA CONTRACT");
  console.log("=================================================");

  // Payload giả lập gửi từ ai-service (theo mục 6.2 B của ticket.md)
  const validEscalatePayload = {
    customer_id: "c0a80123-7b89-4def-9012-3456789abcde",
    customer_email: "khachhang@example.com",
    customer_name: "Nguyễn Văn A",
    chat_session_id: "c0a80123-7b89-4def-9012-3456789abcdf",
    subject: "[AI Escalate] Khách hàng bức xúc về đơn hàng giao trễ",
    content:
      "Tóm tắt cuộc hội thoại:\n- Khách hỏi về đơn #28410417 đặt 5 ngày trước\n- AI xác nhận đơn đang trong trạng thái SHIPPING\n- Khách bắt đầu bức xúc, yêu cầu hoàn tiền và gặp người thật",
    source: "AI_ESCALATE" as const,
    category: "SHIPPING" as const,
    related_order_id: "c0a80123-7b89-4def-9012-3456789abcd0"
  };

  try {
    const validated = escalateTicketSchema.parse(validEscalatePayload);
    console.log("✅ Escalate Payload được parse & validate thành công:");
    console.log(validated);

    // Mô phỏng response data trả về cho ai-service
    const mockCreatedResponse = {
      success: true,
      data: {
        ticket_id: "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a",
        ticket_number: "TK-20261108-015",
        status: "OPEN",
        priority: "P1"
      },
      message: "Ticket đã được tạo thành công và chuyển sang hàng đợi AI phân tích"
    };

    console.log("\n✅ Định dạng Response Body trả về cho ai-service (201 Created):");
    console.log(JSON.stringify(mockCreatedResponse, null, 2));

    console.log("\n=================================================");
    console.log("🎉 KIỂM THỬ ESCALATE CONTRACT THÀNH CÔNG 100%!");
    console.log("=================================================");
  } catch (error: any) {
    console.error("❌ Validation thất bại:", error);
    process.exit(1);
  }
}

testEscalatePayload();

