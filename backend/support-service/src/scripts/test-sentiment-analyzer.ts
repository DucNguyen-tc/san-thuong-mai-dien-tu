import dotenv from "dotenv";
dotenv.config();

import { SentimentService } from "../services/sentiment.service";
import { SentimentAnalysisSchema } from "../schemas/sentiment.schema";

async function runTest() {
  console.log("=================================================");
  console.log("🧪 KIỂM THỬ MODULE AI SENTIMENT ANALYZER (OPENAI)");
  console.log("=================================================");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    console.warn("⚠️  CẢNH BÁO: Chưa tìm thấy OPENAI_API_KEY hợp lệ trong .env!");
    console.log("👉 Đang kiểm tra tính hợp lệ của Zod Schema & Validation Logic với mẫu dữ liệu mẫu:");

    const sampleValidData = {
      sentiment: "ANGRY",
      sentiment_score: 92,
      priority: "P1",
      category: "REFUND",
      summary: "Khách hàng tức giận vì hàng giao trễ 5 ngày và yêu cầu hoàn tiền gấp",
      key_issues: ["Giao hàng chậm 5 ngày", "Hotline không nghe máy", "Đòi hoàn tiền"]
    };

    const validated = SentimentAnalysisSchema.parse(sampleValidData);
    console.log("✅ Zod Schema validation hoạt động chính xác 100%:", validated);
    console.log("\n💡 Để test gọi trực tiếp tới OpenAI, hãy điền OPENAI_API_KEY vào:");
    console.log("   backend/support-service/.env");
    return;
  }

  console.log("🔑 Đã tìm thấy OPENAI_API_KEY. Bắt đầu gọi OpenAI test thực tế...\n");

  const testCases = [
    {
      name: "Case 1: Khách hàng bức xúc (Giao hàng trễ & đòi hoàn tiền)",
      subject: "Giao hàng quá trễ, lừa đảo khách hàng!",
      content:
        "Tôi đặt hàng 5 ngày rồi mà chưa giao, gọi hotline không ai nghe, các bạn làm ăn kiểu gì vậy? Tôi muốn hủy đơn và hoàn tiền ngay lập tức!"
    },
    {
      name: "Case 2: Khách hàng hỏi thông tin ôn hòa",
      subject: "Hỏi về cách đổi địa chỉ nhận hàng",
      content:
        "Chào shop, mình vừa đặt đơn hàng mã #12345 nhưng bị gõ nhầm số nhà, shop hỗ trợ mình đổi lại địa chỉ giao hàng được không ạ? Cảm ơn shop."
    }
  ];

  for (const tc of testCases) {
    console.log(`-----------------------------------------------`);
    console.log(`▶️ Đang chạy: ${tc.name}`);
    console.log(`Tiêu đề: "${tc.subject}"`);
    console.log(`Nội dung: "${tc.content}"`);

    try {
      const startTime = Date.now();
      const result = await SentimentService.analyze(tc.subject, tc.content);
      const duration = Date.now() - startTime;

      console.log(`✅ Kết quả phân tích (thời gian: ${duration}ms):`);
      console.log(`- Cảm xúc (sentiment): ${result.sentiment}`);
      console.log(`- Điểm tiêu cực (sentiment_score): ${result.sentiment_score}/100`);
      console.log(`- Mức độ ưu tiên (priority): ${result.priority}`);
      console.log(`- Danh mục (category): ${result.category}`);
      console.log(`- Tóm tắt (summary): ${result.summary}`);
      console.log(`- Vấn đề chính (key_issues):`, result.key_issues);
    } catch (err: any) {
      console.error(`❌ Thất bại:`, err.message || err);
    }
  }

  console.log(`\n===============================================`);
  console.log(`🎉 KIỂM THỬ HOÀN TẤT`);
  console.log(`===============================================`);
}

runTest();

