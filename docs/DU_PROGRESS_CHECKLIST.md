# CHECKLIST & TIẾN ĐỘ CÔNG VIỆC — DỰ (BẠN 1: BACKEND & AI CORE ENGINEER)

> **Tài liệu nghiệm thu công việc:** Tổng kết chi tiết các đầu việc Bạn 1 (Dự) đã hoàn thành cho toàn bộ **Giai đoạn 2 Tuần (Ngày 1 đến Ngày 14)** theo đúng phân công trong [`docs/kehoachAIASSISTANT.md`](file:///q:/san-thuong-mai-dien-tu/docs/kehoachAIASSISTANT.md).

---

## 1. TỔNG QUAN PHÂN CÔNG CỦA BẠN 1 (DỰ)
- **Vai trò:** Backend & AI Core Engineer
- **Phạm vi phụ trách chính:** `backend/ai-service` (Port 3010), PostgreSQL `ai_db` (pgvector), LLM Orchestrator, RAG Knowledge Base Engine, Hệ thống 12 Tool Calling (Catalog, Cart, Order, Promotion, CSKH Escalate), SSE Chat Streaming, Rate Limiting, Graceful Error Handling, Docker Compose và Tích hợp End-to-End toàn hệ thống.

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
- [x] **Rate Limiting cho Chat API ([`rateLimiter.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/src/middlewares/rateLimiter.ts)):** Sliding window 30 req/phút, trả HTTP 429 hoặc SSE error có `Retry-After`.
- [x] **Giới hạn Context Window (10 tin nhắn gần nhất):** `take: 10` messages gần nhất trong phiên hội thoại.
- [x] **Graceful Error Handling & LLM Timeout:** `withTimeout` (15s) ngắt kết nối LLM nếu treo và tự động chuyển sang Fallback stream.
- [x] **Cập nhật `docker-compose.yml` final:** Port 3010, mạng nội bộ, kết nối `postgres` pgvector và các internal services.

### ✅ Ngày 12-13 (Thứ 2-3 Tuần 3) — HỖ TRỢ TÍCH HỢP & HOÀN THIỆN TOOL ESCALATE / RAG QUERY
- [x] **Hỗ trợ tích hợp & fix bug phát sinh từ integration:**
  - Hỗ trợ Frontend (Bạn 2 - Khoa): Đảm bảo `product_cards` luôn kèm `variant_id` UUID thật, `comparison_table` luôn kèm `highlights` (pros/cons) để UI render trơn tru.
  - Hỗ trợ Support Service (Bạn 3 - Đức): Đảm bảo endpoint `POST /api/ai/rag/query` trả về chính sách (đổi trả, hoàn tiền, bảo hành) có score và chunk chính xác phục vụ chức năng tự động soạn AI Draft Ticket.
- [x] **Hoàn thiện Tool `escalate_to_ticket`:**
  - Kết nối trơn tru tới `support-service:3009/api/support/tickets/escalate`.
  - Tự động nhận diện sentiment bức xúc, trích xuất lý do, sinh mã phiếu hỗ trợ `TK-YYYYMMDD-XXX` và câu trả lời thấu cảm, xoa dịu khách hàng.
  - Có cơ chế fallback mock an toàn nếu `support-service` tạm thời offline trong môi trường dev.
- [x] **Anti-Hallucination Guard (Bảo vệ chính sách & hàng cấm):**
  - Chặn tuyệt đối việc gọi `search_products` khi khách hỏi danh mục hàng cấm (vũ khí, súng đạn, chất cấm,...).
  - Tự động hướng dẫn hotline Chăm sóc khách hàng: 1900-6868.
- [x] **Bộ kịch bản kiểm thử tích hợp Ngày 12-13 ([`test-day12-13.ts`](file:///c:/Users/Lenovo/Desktop/do%20an/san-thuong-mai-dien-tu/backend/ai-service/src/scripts/test-day12-13.ts)):**
  - Kịch bản 1: Luồng AI Shopping tích hợp Frontend (Product Cards có `variant_id`, Comparison Table có `highlights`, thêm giỏ hàng) ✅
  - Kịch bản 2: Luồng CSKH Escalate Ticket tích hợp Support Service (Bắt cảm xúc giận dữ, tự động tạo ticket, phản hồi thấu cảm) ✅
  - Kịch bản 3: Luồng Support Service RAG Query (Tìm chunk chính sách đổi trả / hoàn tiền cho Bạn 3) ✅
  - Kịch bản 4: Luồng Anti-Hallucination & Chặn hàng cấm (Từ chối bịa đặt và hướng dẫn hotline 1900-6868) ✅
- [x] **Kết quả kiểm thử:** Đạt **4/4 kịch bản kiểm thử tích hợp Ngày 12-13 thành công xuất sắc (100%)**.

### ⏳ Ngày 14 (Thứ 4 Tuần 3) — TỔNG KIỂM THỬ TOÀN DIỆN & DEMO
- [ ] Chạy tổng kiểm thử E2E liên thông toàn hệ thống (ai-service ↔ frontend ↔ support-service ↔ notification-service).
- [ ] Chuẩn bị kịch bản demo và tài liệu thuyết trình tốt nghiệp.

---

## 3. DANH SÁCH FILE ĐÃ TẠO / CẬP NHẬT (NGÀY 12-13)

| File | Trạng thái | Mô tả |
|---|---|---|
| `backend/ai-service/src/scripts/test-day12-13.ts` | **Mới (Ngày 12-13)** | Kịch bản kiểm thử tích hợp toàn diện Ngày 12-13 cho Bạn 1 (Dự) |
| `backend/ai-service/src/services/llm-orchestrator.ts` | **Cập nhật (Ngày 12-13)** | Bổ sung bộ lọc chặn tìm kiếm hàng cấm (Anti-Hallucination) |
| `backend/ai-service/src/middlewares/rateLimiter.ts` | Đã hoàn thành | Middleware Rate Limiting sliding window (30 reqs/min) |
| `backend/ai-service/src/tools/ticket.tool.ts` | Đã hoàn thành | Tool `escalate_to_ticket` kết nối `support-service:3009` |
| `backend/ai-service/src/tools/cart.tool.ts` | Đã hoàn thành | Tool Calling giỏ hàng |
| `backend/ai-service/src/tools/order.tool.ts` | Đã hoàn thành | Tool Calling đơn hàng & xác nhận 2 bước |
| `backend/ai-service/src/tools/promotion.tool.ts` | Đã hoàn thành | Tool Calling khuyến mãi |
| `backend/ai-service/src/tools/catalog.tool.ts` | Đã hoàn thành | Tool Calling tìm kiếm và so sánh sản phẩm |
| `backend/ai-service/src/controllers/chat.controller.ts` | Đã hoàn thành | SSE Streaming Chat Controller |
| `backend/ai-service/src/controllers/rag.controller.ts` | Đã hoàn thành | Endpoint `POST /api/ai/rag/query` |
| `docs/DU_PROGRESS_CHECKLIST.md` | **Cập nhật (Ngày 12-13)** | Báo cáo nghiệm thu hoàn tất các nhiệm vụ tích hợp Ngày 12-13 |

---

## 4. KẾT LUẬN & SẴN SÀNG MERGE VÀO DEVELOP
- Nhiệm vụ Ngày 12-13 của Bạn 1 (Dự) đã hoàn thành xuất sắc và vượt qua 100% kiểm thử tích hợp.
- Sẵn sàng tạo Pull Request từ nhánh `feature/ai-service-day-12-13` vào `develop`.
