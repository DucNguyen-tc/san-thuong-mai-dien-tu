# CHECKLIST & TIẾN ĐỘ CÔNG VIỆC — DỰ (BẠN 1: BACKEND & AI CORE ENGINEER)

> **Tài liệu nghiệm thu công việc:** Tổng kết chi tiết các đầu việc Bạn 1 (Dự) đã hoàn thành cho giai đoạn **Ngày 1 đến Ngày 3 (Hạn chót tối Thứ 6)** theo đúng phân công trong [`docs/kehoachAIASSISTANT.md`](file:///q:/san-thuong-mai-dien-tu/docs/kehoachAIASSISTANT.md).

---

## 1. TỔNG QUAN PHÂN CÔNG CỦA BẠN 1 (DỰ)
- **Vai trò:** Backend & AI Core Engineer
- **Phạm vi phụ trách chính:** `backend/ai-service` (Port 3010), PostgreSQL `ai_db` (pgvector), LLM Orchestrator, RAG Knowledge Base Engine, SSE Chat Streaming và API Gateway route `/ai`.

---

## 2. TRẠNG THÁI TIẾN ĐỘ THEO NGÀY (HẠN TỐI THỨ 6)

### ✅ Ngày 1 (Thứ 2) — SETUP HỆ THỐNG & SCHEMA DATABASE
- [x] Scaffold dịch vụ `backend/ai-service` (Express, TypeScript, Prisma, Zod, UUID, CORS, Axios).
- [x] Thiết kế Database Schema `ai_db` hoàn chỉnh:
  - `chat_sessions`: Quản lý phiên hội thoại của khách hàng (Session Token, Customer ID).
  - `chat_messages`: Lưu vết tin nhắn (Role, Content, Tool Calls, Metadata JSONB).
  - `knowledge_documents`: Tài liệu chính sách sàn (Title, Source Type, Content).
  - `document_chunks`: Các đoạn văn bản chia nhỏ kèm vector embedding `vector(1536)`.
- [x] Thêm service `ai-service` vào `docker-compose.yml` (Port 3010, liên kết `postgres` và `api-gateway`).
- [x] Tạo file khởi tạo database [`database/ai_db.sql`](file:///q:/san-thuong-mai-dien-tu/database/ai_db.sql) chứa DDL và extension `pgvector`.
- [x] Cấu hình route `/ai` trên `api-gateway` kèm middleware `optionalToken` (hỗ trợ cả khách vãng lai và người dùng đã đăng nhập mang theo `x-user-id`).

### ✅ Ngày 2-3 (Thứ 3-4, Hạn nộp tối Thứ 6) — RAG PIPELINE & LLM STREAMING
- [x] **Tích hợp LLM Provider:**
  - Hỗ trợ Google Gemini 1.5 Flash SDK (`@google/generative-ai`).
  - Hỗ trợ OpenAI GPT-4o-mini SDK (`openai`).
  - Tích hợp Smart Fallback offline (vẫn trả lời mượt mà kể cả khi chưa nạp API key).
- [x] **Viết module `llm-orchestrator.ts`:**
  - Tích hợp System Prompt chống bịa đặt (Anti-Hallucination) chuẩn Mục 4.3 trong `docs/AI_SHOPPING_ASSISTANT_AND_RAG.md`.
  - Hỗ trợ truyền ngữ cảnh (Context Chunks) từ RAG vào System Prompt để LLM trả lời chính xác điều khoản sàn.
- [x] **Xây dựng RAG Pipeline:**
  - Kỹ thuật Chunking: Phân đoạn văn bản 200–500 từ, chồng lấn (overlap) 50 từ, ngắt câu tự nhiên theo dấu chấm.
  - Module Embedding (`embedding.service.ts`): Sinh vector chuẩn 1536 chiều từ OpenAI / Gemini / Hash fallback.
  - Vector Cosine Similarity Search: Truy vấn `c.embedding <=> $1::vector` trên PostgreSQL pgvector.
- [x] **Endpoint RAG Query (`POST /api/ai/rag/query`):**
  - Cung cấp API cho **Bạn 3 (Đức)** tra cứu chunk chính sách kèm điểm số tương đồng `score` để tự động soạn thảo Draft ticket CSKH.
- [x] **Endpoint Chat SSE (`POST /api/ai/chat`):**
  - Stream phản hồi theo chuẩn Server-Sent Events cho **Bạn 2 (Khoa)**:
    - `event: session`: Trả về `session_id`, `session_token`.
    - `event: message` (`text_chunk`): Chữ chạy thời gian thực.
    - `event: message` (`metadata`): Trả về thẻ sản phẩm (`product_cards`) hoặc bảng so sánh (`comparison_table`).
    - `event: done`: Báo hoàn tất câu trả lời.
- [x] **Nạp sẵn 6 bộ chính sách Knowledge Base ([`prisma/seed.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/prisma/seed.ts)):**
  - Đổi trả 7 ngày, Bảo hành chính hãng, Chi phí & thời gian giao hàng, Hướng dẫn thanh toán, Hướng dẫn hủy đơn & hoàn tiền, Quy chế hoạt động sàn TMĐT.
- [x] **Sửa lỗi cú pháp merge conflict tại `backend/api-gateway/src/routes.ts`:**
  - Thêm `);` đóng middleware `/support/health` dòng 58 theo lưu ý của Khoa.

---

## 3. DANH SÁCH FILE ĐÃ TẠO / CẬP NHẬT

| File | Mô tả |
|---|---|
| `backend/ai-service/src/services/llm-orchestrator.ts` | Bộ điều phối LLM (Gemini, OpenAI, Fallback) và System Prompt chống bịa đặt |
| `backend/ai-service/src/services/rag.service.ts` | RAG Pipeline (Chunking, Vector Retrieval, In-memory Fallback) |
| `backend/ai-service/src/services/embedding.service.ts` | Sinh vector Embedding 1536 chiều |
| `backend/ai-service/src/controllers/chat.controller.ts` | Endpoint SSE Streaming Chat + Metadata Product Cards / Comparison Table |
| `backend/ai-service/src/controllers/rag.controller.ts` | Endpoint `POST /api/ai/rag/query` phục vụ Bạn 3 |
| `backend/ai-service/prisma/schema.prisma` | Schema 4 bảng của `ai_db` hỗ trợ pgvector |
| `backend/ai-service/prisma/seed.ts` | Script nạp tự động 6 bộ chính sách sàn |
| `backend/api-gateway/src/routes.ts` | Đã fix lỗi cú pháp dòng 58 và kích hoạt proxy `/ai` |
| `database/ai_db.sql` | DDL khởi tạo database `ai_db` và extension `vector` |

---

## 4. BƯỚC TIẾP THEO (TUẦN 2)
- [ ] Implement Tool Calling thật: `search_products` và `get_product_details` gọi sang `catalog-service:3002`.
- [ ] Trích xuất `variants[0]?.id` gắn vào `variant_id` trong thẻ sản phẩm cho Khoa.
- [ ] Phối hợp kiểm thử E2E giữa Frontend Chat Widget ↔ Backend AI Service ↔ Support Service.

