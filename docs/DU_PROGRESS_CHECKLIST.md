# CHECKLIST & TIẾN ĐỘ CÔNG VIỆC — DỰ (BẠN 1: BACKEND & AI CORE ENGINEER)

> **Tài liệu nghiệm thu công việc:** Tổng kết chi tiết các đầu việc Bạn 1 (Dự) đã hoàn thành cho giai đoạn **Ngày 1 đến Ngày 5 (Tuần 1)** theo đúng phân công trong [`docs/kehoachAIASSISTANT.md`](file:///q:/san-thuong-mai-dien-tu/docs/kehoachAIASSISTANT.md).

---

## 1. TỔNG QUAN PHÂN CÔNG CỦA BẠN 1 (DỰ)
- **Vai trò:** Backend & AI Core Engineer
- **Phạm vi phụ trách chính:** `backend/ai-service` (Port 3010), PostgreSQL `ai_db` (pgvector), LLM Orchestrator, RAG Knowledge Base Engine, Tool Calling (`search_products`, `get_product_details`, `compare_products`), SSE Chat Streaming và API Gateway route `/ai`.

---

## 2. TRẠNG THÁI TIẾN ĐỘ THEO NGÀY

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

### ✅ Ngày 2-3 (Thứ 3-4) — RAG PIPELINE & LLM STREAMING
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

### ✅ Ngày 4-5 (Thứ 5-6) — TOOL CALLING & METADATA STREAMING
- [x] **Xây dựng module `catalog.tool.ts`:**
  - Tool 1 `search_products`: Tìm kiếm sản phẩm theo từ khóa, khoảng giá (`min_price`, `max_price`), sắp xếp gọi `catalog-service:3002/api/catalog/products`. Tự động fallback sang kho sản phẩm mẫu chuẩn mực khi môi trường dev chưa bật service catalog.
  - Tool 2 `get_product_details`: Lấy chi tiết thông số kỹ thuật, cấu hình và danh sách các biến thể của sản phẩm.
  - Tool 3 `compare_products`: So sánh 2-4 sản phẩm dựa trên 7 tiêu chí phần cứng (Giá, Màn hình, Chip, RAM/ROM, Camera, Pin, Khung viền) và sinh gợi ý tư vấn mua sắm `recommendation` từ AI.
- [x] **Khớp 100% Contract Frontend với Khoa (`docs/NOTES_CHO_DU_BAN1.md`):**
  - Gán chính xác `variant_id = variants[0]?.id` (UUID thật) cho toàn bộ thẻ trong `product_cards` để người dùng bấm nút "Thêm giỏ" trên Chat Widget sẽ thêm thẳng vào giỏ hàng.
  - Xử lý giá gốc `original_price` và tỉ lệ giảm giá `discount_percent` (set `null`/`0` nếu không giảm giá).
- [x] **Tích hợp Function Calling vào `llm-orchestrator.ts`:**
  - Khai báo Schema Function Declarations cho Gemini 1.5 Flash (`search_products`, `get_product_details`, `compare_products`).
  - Xây dựng bộ Intent Detector thông minh để tự động kích hoạt Tool Calling và stream dữ liệu mượt mà ở cả chế độ online lẫn fallback.
- [x] **Đấu nối vào `chat.controller.ts`:**
  - Loại bỏ hoàn toàn mock cứng cũ, tích hợp luồng Tool Calling trực tiếp trong SSE stream.
  - Lưu trữ `metadata` và lịch sử chat vào database `ai_db`.
- [x] **Kiểm thử tự động End-to-End ([`test-day4-5.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/src/scripts/test-day4-5.ts)):**
  - Vượt qua 5/5 bài kiểm thử:
    1. `search_products` trả về danh sách có `variant_id` hợp lệ.
    2. `get_product_details` lấy thông số chính xác.
    3. `compare_products` tạo bảng so sánh 7 tiêu chí.
    4. SSE stream text chunks + metadata thẻ sản phẩm realtime.
    5. SSE stream text chunks + metadata bảng so sánh realtime.

---

## 3. DANH SÁCH FILE ĐÃ TẠO / CẬP NHẬT

| File | Trạng thái | Mô tả |
|---|---|---|
| `backend/ai-service/src/tools/catalog.tool.ts` | **Mới (Ngày 4-5)** | Module Tool Calling: `searchProducts`, `getProductDetails`, `compareProducts`, fallback data chuẩn |
| `backend/ai-service/src/services/llm-orchestrator.ts` | **Cập nhật (Ngày 4-5)** | Tích hợp Gemini Function Calling, Intent Detector thông minh, stream text + metadata |
| `backend/ai-service/src/controllers/chat.controller.ts` | **Cập nhật (Ngày 4-5)** | Đấu nối Tool Calling trực tiếp vào SSE stream, lưu metadata vào DB |
| `backend/ai-service/src/scripts/test-day4-5.ts` | **Mới (Ngày 4-5)** | Script kiểm thử tự động toàn bộ 5 tính năng Ngày 4-5 |
| `backend/ai-service/src/services/rag.service.ts` | Đã hoàn thành | RAG Pipeline (Chunking, Vector Retrieval, In-memory Fallback) |
| `backend/ai-service/src/services/embedding.service.ts` | Đã hoàn thành | Sinh vector Embedding 1536 chiều |
| `backend/ai-service/src/controllers/rag.controller.ts` | Đã hoàn thành | Endpoint `POST /api/ai/rag/query` phục vụ Bạn 3 |
| `backend/ai-service/prisma/schema.prisma` | Đã hoàn thành | Schema 4 bảng của `ai_db` hỗ trợ pgvector |
| `backend/ai-service/prisma/seed.ts` | Đã hoàn thành | Script nạp tự động 6 bộ chính sách sàn |
| `backend/api-gateway/src/routes.ts` | Đã hoàn thành | Đã fix lỗi cú pháp dòng 58 và kích hoạt proxy `/ai` |
| `database/ai_db.sql` | Đã hoàn thành | DDL khởi tạo database `ai_db` và extension `vector` |

---

## 4. KẾT LUẬN & SẴN SÀNG MERGE
- Mã nguồn độc lập hoàn toàn bên trong thư mục `backend/ai-service/`, không gây bất kỳ xung đột (conflict) nào với code của Khoa (`frontend/`) hay Đức (`backend/support-service/`).
- Hợp đồng API và cấu trúc JSON metadata khớp 100% với giao diện Chat Widget mà Khoa đã đẩy lên `develop`.
- Toàn bộ service build sạch (`tsc` exit 0), sẵn sàng tạo Pull Request để merge vào `develop`.
