# CHECKLIST & TIẾN ĐỘ CÔNG VIỆC — DỰ (BẠN 1: BACKEND & AI CORE ENGINEER)

> **Tài liệu nghiệm thu công việc:** Tổng kết chi tiết các đầu việc Bạn 1 (Dự) đã hoàn thành cho giai đoạn **Ngày 1 đến Ngày 11 (Tuần 1 & Tuần 2)** theo đúng phân công trong [`docs/kehoachAIASSISTANT.md`](file:///q:/san-thuong-mai-dien-tu/docs/kehoachAIASSISTANT.md).

---

## 1. TỔNG QUAN PHÂN CÔNG CỦA BẠN 1 (DỰ)
- **Vai trò:** Backend & AI Core Engineer
- **Phạm vi phụ trách chính:** `backend/ai-service` (Port 3010), PostgreSQL `ai_db` (pgvector), LLM Orchestrator, RAG Knowledge Base Engine, Hệ thống 12 Tool Calling (Catalog, Cart, Order, Promotion, CSKH Escalate), SSE Chat Streaming, Rate Limiting, Graceful Error Handling và Docker Compose.

---

## 2. TRẠNG THÁI TIẾN ĐỘ THEO NGÀY

### ✅ Ngày 1 (Thứ 2) — SETUP HỆ THỐNG & SCHEMA DATABASE
- [x] Scaffold dịch vụ `backend/ai-service` (Express, TypeScript, Prisma, Zod, UUID, CORS, Axios).
- [x] Thiết kế Database Schema `ai_db` hoàn chỉnh (`chat_sessions`, `chat_messages`, `knowledge_documents`, `document_chunks`).
- [x] Thêm service `ai-service` vào `docker-compose.yml` (Port 3010, liên kết `postgres` và `api-gateway`).
- [x] Tạo file khởi tạo database [`database/ai_db.sql`](file:///q:/san-thuong-mai-dien-tu/database/ai_db.sql) chứa DDL và extension `pgvector`.
- [x] Cấu hình route `/ai` trên `api-gateway` kèm middleware `optionalToken`.

### ✅ Ngày 2-3 (Thứ 3-4) — RAG PIPELINE & LLM STREAMING
- [x] **Tích hợp LLM Provider:** Gemini 1.5 Flash SDK, OpenAI GPT-4o-mini, Smart Fallback offline.
- [x] **Viết module `llm-orchestrator.ts`:** System Prompt chống bịa đặt (Anti-Hallucination) chuẩn Mục 4.3 trong `docs/AI_SHOPPING_ASSISTANT_AND_RAG.md`.
- [x] **Xây dựng RAG Pipeline:** Chunking 200–500 từ, overlap 50 từ, vector embedding 1536 chiều, cosine similarity `c.embedding <=> $1::vector`.
- [x] **Endpoint RAG Query (`POST /api/ai/rag/query`):** Phục vụ Bạn 3 (Đức) tra cứu chunk chính sách kèm score để soạn draft ticket CSKH.
- [x] **Endpoint Chat SSE (`POST /api/ai/chat`):** Stream phản hồi theo chuẩn Server-Sent Events (`session`, `text_chunk`, `metadata`, `done`).
- [x] **Nạp sẵn 6 bộ chính sách Knowledge Base ([`prisma/seed.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/prisma/seed.ts)).**

### ✅ Ngày 4-5 (Thứ 5-6) — TOOL CALLING & METADATA STREAMING
- [x] **Xây dựng module `catalog.tool.ts`:** `search_products`, `get_product_details`, `compare_products`.
- [x] **Khớp 100% Contract Frontend với Khoa:** Gán `variant_id = variants[0]?.id` cho toàn bộ thẻ trong `product_cards` để bấm "Thêm giỏ" chạy ngay.

### ✅ Ngày 6-7 (Thứ 2-3 Tuần 2) — CART, ORDER & PROMOTION TOOLS
- [x] **Xây dựng module `cart.tool.ts`:** `add_to_cart`, `get_cart`, `update_cart_item`, `remove_cart_item`, kiểm tra JWT `x-user-id`.
- [x] **Xây dựng module `order.tool.ts`:** `get_orders`, `get_order_detail`, `cancel_order`.
- [x] **Xây dựng module `promotion.tool.ts`:** `check_promotions` tra cứu voucher / flash sale.
- [x] **Nâng cấp `compare_products` với `highlights` (Pros/Cons):** Khớp component `ChatComparisonTable.tsx` của Khoa.

### ✅ Ngày 8-9 (Thứ 4-5 Tuần 2) — ESCALATE TO TICKET & SECURITY POLICIES
- [x] **Xây dựng module `ticket.tool.ts`:** Tool 11 `escalate_to_ticket` gọi sang `support-service:3009/api/support/tickets/escalate`.
- [x] **Tự động nhận diện bức xúc (Sentiment & Escalation Detector):** Nhận diện từ khóa tiêu cực để tự động chuyển ticket sang CSKH.
- [x] **Hoàn thiện bảo mật:** Xác nhận 2 bước cho `cancel_order` và bắt buộc đăng nhập đối với khách vãng lai (Guest).

### ✅ Ngày 10-11 (Thứ 6-7 Tuần 2) — POLISH & EDGE CASES
- [x] **Rate Limiting cho Chat API ([`rateLimiter.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/src/middlewares/rateLimiter.ts)):**
  - Xây dựng middleware Rate Limiter sliding window: Tối đa 30 requests / phút theo User ID / IP / Session Token.
  - Phản hồi HTTP 429 hoặc gói tin SSE error kèm header `Retry-After`, bảo vệ hệ thống và quota LLM khỏi spam/DDoS.
- [x] **Giới hạn Context Window (10 tin nhắn gần nhất):**
  - Cập nhật truy vấn `prisma.chatMessage.findMany` giới hạn `take: 10` tin nhắn gần nhất trong phiên hội thoại, đảm bảo trí nhớ ngữ cảnh tối ưu, không vượt context limit và giảm chi phí token.
- [x] **Graceful Error Handling & LLM Timeout:**
  - Bổ sung cơ chế `withTimeout` (15s) cho toàn bộ lệnh gọi LLM SDK (Gemini & OpenAI), tự động chuyển sang Fallback stream nếu LLM bị treo hoặc timeout.
  - Xử lý lỗi êm ái khi các microservice ngoài (Catalog, Cart, Order, Support) tạm thời offline hoặc gặp lỗi mạng.
- [x] **Cập nhật `docker-compose.yml` final:**
  - Xác nhận cấu hình hoàn chỉnh cho container `ai-service` (Port 3010, kết nối mạng nội bộ, liên kết `postgres`, `catalog-service`, `cart-service`, `order-service`, `support-service`).
- [x] **Kiểm thử tự động ([`test-day10-11.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/src/scripts/test-day10-11.ts)):**
  - Đạt **5/5 tests passed 100%**:
    1. Chặn request vượt ngưỡng với mã lỗi 429.
    2. Cắt chuẩn xác 10 tin nhắn gần nhất cho Context Window.
    3. Error handling êm dịu khi toàn bộ các service ngoài offline.
    4. Timeout fallback không gây crash luồng SSE streaming.
    5. Đồng bộ toàn bộ 12/12 Tool Calling hoạt động chính xác.

---

## 3. DANH SÁCH FILE ĐÃ TẠO / CẬP NHẬT

| File | Trạng thái | Mô tả |
|---|---|---|
| `backend/ai-service/src/middlewares/rateLimiter.ts` | **Mới (Ngày 10-11)** | Middleware Rate Limiting sliding window (30 reqs/min) |
| `backend/ai-service/src/routes/chat.routes.ts` | **Cập nhật (Ngày 10-11)** | Gắn `chatRateLimiter` vào route `POST /api/ai/chat` |
| `backend/ai-service/src/controllers/chat.controller.ts` | **Cập nhật (Ngày 10-11)** | Giới hạn `take: 10` messages cho context window |
| `backend/ai-service/src/services/llm-orchestrator.ts` | **Cập nhật (Ngày 10-11)** | Tích hợp timeout bảo vệ (15s) và graceful fallback |
| `backend/ai-service/src/scripts/test-day10-11.ts` | **Mới (Ngày 10-11)** | Script kiểm thử toàn diện Ngày 10-11 (5/5 passed) |
| `docs/DU_PROGRESS_CHECKLIST.md` | **Cập nhật (Ngày 10-11)** | Báo cáo tiến độ nghiệm thu hoàn tất Ngày 10-11 |

---

## 4. KẾT LUẬN & SẴN SÀNG MERGE
- Toàn bộ service build sạch (`tsc` exit 0), pass 100% test suite.
- Sẵn sàng tạo Pull Request để merge vào `develop`.
