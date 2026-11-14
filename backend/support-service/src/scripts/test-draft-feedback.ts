import { DraftService, GenerateDraftInput } from "../services/draft.service";
import { LLMClient } from "../services/llm.client";

async function testFeedbackInjection() {
  const input: GenerateDraftInput = {
    customerName: "Anh Nam",
    ticketNumber: "TK-20261113-001",
    subject: "Giao trễ",
    content: "Chờ 4 ngày chưa thấy hàng",
    sentiment: "ANGRY",
    sentimentScore: 85,
    summary: "Đơn giao trễ",
    keyIssues: ["Giao trễ"],
    ragChunks: [],
    revisionInstruction: "Nhấn mạnh tặng voucher 100k đền bù"
  };

  let capturedPrompt = "";
  LLMClient.generateStructuredResponse = async (prompt: string) => {
    capturedPrompt = prompt;
    return JSON.stringify({
      draft: "Kính gửi Anh Nam, chúng tôi xin lỗi vì giao trễ và gửi tặng voucher 100k đền bù.",
      tone: "APOLOGETIC",
      confidence: 90,
      policy_references: ["Chính sách bồi hoàn"]
    });
  };

  const draft = await DraftService.generateDraft(input);
  console.log("Generated draft with feedback:", draft);
  if (!draft.draft || draft.draft.length < 20) {
    throw new Error("Draft content invalid");
  }
  if (!capturedPrompt.includes("Nhấn mạnh tặng voucher 100k đền bù")) {
    throw new Error("Prompt does not contain revision instruction");
  }
  console.log("✅ Task 2 test passed!");
}

testFeedbackInjection().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});

