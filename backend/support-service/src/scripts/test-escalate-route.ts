import { app } from "../app";
import { Server } from "http";

async function testEscalateRoute() {
  console.log("=================================================");
  console.log("🧪 KIỂM THỬ ROUTE POST /api/support/tickets/escalate");
  console.log("=================================================");

  const server: Server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === "string") {
    console.error("Không lấy được port server");
    process.exit(1);
  }

  const port = address.port;
  const baseUrl = `http://localhost:${port}/api/support/tickets/escalate`;
  console.log(`🚀 Test server đang chạy tại cổng tạm: ${port}`);

  try {
    // ----------------------------------------------------
    // Test Case 1: Gửi payload sai định dạng (Thiếu customer_id, content quá ngắn)
    // ----------------------------------------------------
    console.log("\n▶️ Test Case 1: Kiểm tra Validate Body (Payload sai)");
    const invalidRes = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Hi",
        content: "Ngắn"
      })
    });

    const invalidJson = await invalidRes.json();
    console.log(`Status Code: ${invalidRes.status} (Kỳ vọng: 400)`);
    console.log("Phản hồi lỗi validation:", invalidJson);

    if (invalidRes.status !== 400 || invalidJson.success !== false) {
      throw new Error("Test Case 1 thất bại: Không chặn payload sai");
    }
    console.log("✅ Test Case 1 PASSED: Middleware Validate chặn đúng chuẩn.");

    // ----------------------------------------------------
    // Test Case 2: Kiểm tra Internal Access (Không cần Token JWT)
    // ----------------------------------------------------
    console.log("\n▶️ Test Case 2: Kiểm tra route không bị chặn bởi Auth Middleware (No JWT)");
    const validPayload = {
      customer_id: "c0a80123-7b89-4def-9012-3456789abcde",
      customer_email: "test.customer@example.com",
      customer_name: "Khách Hàng Test",
      chat_session_id: "c0a80123-7b89-4def-9012-3456789abcdf",
      subject: "[AI Escalate] Khách hàng bức xúc đơn hàng",
      content: "Khách trao đổi trong AI Chat: 'Đơn hàng 5 ngày chưa tới, tôi muốn gặp nhân viên CSKH'",
      category: "SHIPPING",
      source: "AI_ESCALATE"
    };

    const validRes = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload)
    });

    const validJson = await validRes.json();
    console.log(`Status Code: ${validRes.status}`);
    console.log("Response Body:", validJson);

    // Không được là 401 Unauthorized
    if (validRes.status === 401) {
      throw new Error("Test Case 2 thất bại: Route bị chặn bởi 401 Unauthorized");
    }

    console.log("✅ Test Case 2 PASSED: Route /escalate mở cổng chuẩn xác cho ai-service (Không đòi hỏi Bearer Token).");

    console.log("\n=================================================");
    console.log("🎉 TẤT CẢ ROUTE TESTS CHO ESCALATE API ĐÃ PASS 100%!");
    console.log("=================================================");
  } catch (error: any) {
    console.error("❌ Test thất bại:", error.message || error);
  } finally {
    server.close();
  }
}

testEscalateRoute();

