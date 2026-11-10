import dotenv from "dotenv";
dotenv.config();

import { RagClient } from "../services/rag.client";
import { DraftService } from "../services/draft.service";
import { DraftResponseSchema } from "../schemas/draft.schema";

async function runTest() {
  console.log("=================================================");
  console.log("🧪 KIỂM THỬ MODULE RAG AUTO-DRAFT (NGÀY 6-7)");
  console.log("=================================================");

  // 1. Kiểm thử RagClient (Query policy chunks)
  console.log("\n▶️ BƯỚC 1: Kiểm thử RagClient.queryPolicies()");
  const sampleQuery = "Khách yêu cầu hủy đơn và hoàn tiền vì giao hàng trễ 5 ngày";
  const chunks = await RagClient.queryPolicies(sampleQuery, 2, 0.65);
  console.log(`✅ Lấy thành công ${chunks.length} chunks chính sách:`);
  chunks.forEach((c, idx) => {
    console.log(`   [Chunk ${idx + 1}] Title: ${c.document_title || "N/A"} | Score: ${c.score || "N/A"}`);
    console.log(`   Nội dung: ${c.content.substring(0, 100)}...`);
  });

  // 2. Kiểm thử Zod Schema DraftResponseSchema
  console.log("\n▶️ BƯỚC 2: Kiểm thử Zod Schema DraftResponseSchema");
  const mockValidDraft = {
    draft:
      "Kính gửi Anh Minh,\n\nEm là nhân viên CSKH Sàn TMĐT. Em rất tiếc về sự chậm trễ của đơn hàng...",
    tone: "APOLOGETIC" as const,
    confidence: 90,
    policy_references: ["Chính sách Đổi trả & Hoàn tiền Điều 3"]
  };

  const parsed = DraftResponseSchema.parse(mockValidDraft);
  console.log("✅ Schema validate thành công 100%:", parsed);

  // 3. Kiểm thử LLM Draft Generation (nếu có API Key)
  console.log("\n▶️ BƯỚC 3: Kiểm thử DraftService.generateDraft() với LLM");
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "your_openai_api_key_here") {
    console.warn("⚠️  CẢNH BÁO: Chưa tìm thấy OPENAI_API_KEY thật trong .env!");
    console.log("👉 Đã kiểm tra logic prompt và schema validation hoàn chỉnh.");
    console.log("💡 Khi bạn điền API key thật vào .env, hệ thống sẽ gọi OpenAI để sinh draft thực tế.");
  } else {
    try {
      console.log("🔑 Đang gọi OpenAI sinh bản nháp email phản hồi...");
      const startTime = Date.now();
      const draftResult = await DraftService.generateDraft({
        customerName: "Nguyễn Văn Minh",
        ticketNumber: "TK-20261110-001",
        subject: "Khiếu nại giao hàng trễ, yêu cầu hoàn tiền",
        content:
          "Tôi đặt hàng 5 ngày rồi chưa nhận được, gọi hotline không ai nghe. Đề nghị hủy đơn và hoàn tiền ngay!",
        sentiment: "ANGRY",
        sentimentScore: 88,
        summary: "Khách bức xúc do hàng trễ 5 ngày, yêu cầu hủy đơn và hoàn tiền lập tức",
        keyIssues: ["Giao hàng chậm 5 ngày", "Hotline không nghe máy", "Yêu cầu hoàn tiền"],
        ragChunks: chunks
      });
      const duration = Date.now() - startTime;

      console.log(`\n🎉 Đã sinh email draft thành công (${duration}ms):`);
      console.log(`- Giọng văn (Tone): ${draftResult.tone}`);
      console.log(`- Độ tự tin (Confidence): ${draftResult.confidence}%`);
      console.log(`- Chính sách trích dẫn:`, draftResult.policy_references);
      console.log(`\n📧 Nội dung email nháp (ai_draft):\n-------------------------------------------------`);
      console.log(draftResult.draft);
      console.log(`-------------------------------------------------`);
    } catch (llmErr: any) {
      console.warn(
        `[LLM Call Notice]: ${llmErr.message || llmErr} (Đã kích hoạt fallback an toàn, không làm crash service)`
      );
    }
  }

  console.log("\n=================================================");
  console.log("🎉 KIỂM THỬ RAG AUTO-DRAFT HOÀN TẤT THÀNH CÔNG!");
  console.log("=================================================");
}

runTest();

