# CHECKLIST & TIẾN ĐỘ CÔNG VIỆC — DỰ (BẠN 1: BACKEND & AI CORE ENGINEER)

> **Tài liệu nghiệm thu công việc:** Tổng kết chi tiết các đầu việc Bạn 1 (Dự) đã hoàn thành cho giai đoạn **Ngày 1 đến Ngày 9 (Tuần 1 & Giữa Tuần 2)** theo đúng phân công trong [`docs/kehoachAIASSISTANT.md`](file:///q:/san-thuong-mai-dien-tu/docs/kehoachAIASSISTANT.md).

---

## 1. TỔNG QUAN PHÂN CÔNG CỦA BẠN 1 (DỰ)
- **Vai trò:** Backend & AI Core Engineer
- **Phạm vi phụ trách chính:** `backend/ai-service` (Port 3010), PostgreSQL `ai_db` (pgvector), LLM Orchestrator, RAG Knowledge Base Engine, Hệ thống Tool Calling (Catalog, Cart, Order, Promotion, CSKH Escalate), SSE Chat Streaming và API Gateway route `/ai`.

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
- [x] **Xây dựng module `ticket.tool.ts`:**
  - Tool 11 `escalate_to_ticket`: Gọi `POST http://support-service:3009/api/support/tickets/escalate` đúng schema Mục 6.2 trong `docs/ticket.md`.
  - Tự động sinh `subject`, `content`, phân loại `category` (`REFUND`, `WARRANTY`, `SHIPPING`, `PAYMENT`, `OTHER`), gán `source = 'AI_ESCALATE'`.
  - Trả về mã ticket hiển thị `TK-YYYYMMDD-XXX` kèm lời xin lỗi thấu cảm và hướng dẫn chờ email CSKH.
- [x] **Tự động nhận diện bức xúc (Sentiment & Escalation Detector):**
  - Tích hợp bộ lọc từ khóa phản ánh: *"lừa đảo"*, *"khiếu nại"*, *"bức xúc"*, *"gặp người thật"*, *"tổng đài viên"*, *"tại sao chưa giao"*, *"kiện"*, *"trả tiền đây"*.
  - AI tự động kích hoạt `escalate_to_ticket` mà không cần người dùng yêu cầu thủ công.
- [x] **Hoàn thiện bảo mật hành động nhạy cảm & Guest Handling:**
  - Xác nhận 2 bước cho `cancel_order`: Bắt buộc người dùng nhập xác nhận rõ ràng trước khi gọi API hủy.
  - Từ chối lịch sự và hướng dẫn đăng nhập khi khách vãng lai (Guest) yêu cầu xem hoặc thao tác giỏ hàng/đơn hàng.
- [x] **Đấu nối toàn diện vào `llm-orchestrator.ts` & `chat.controller.ts`:**
  - Gemini Function Declarations bổ sung `escalate_to_ticket`.
  - `chat.controller.ts` truyền đầy đủ `sessionId`, `customerEmail`, `customerName` cho tool CSKH.
- [x] **Kiểm thử tự động ([`test-day8-9.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/src/scripts/test-day8-9.ts)):**
  - Đạt **5/5 tests passed 100%**:
    1. Tạo ticket escalate trực tiếp thành công.
    2. LLM Orchestrator tự động bắt sự bức xúc của khách và chuyển ticket.
    3. Hủy đơn hàng an toàn qua 2 bước.
    4. Chặn khách vãng lai khi thao tác thông tin cá nhân.
    5. Hồi quy kiểm thử các tính năng tìm kiếm và so sánh sản phẩm.

---

## 3. DANH SÁCH FILE ĐÃ TẠO / CẬP NHẬT

| File | Trạng thái | Mô tả |
|---|---|---|
| `backend/ai-service/src/tools/ticket.tool.ts` | **Mới (Ngày 8-9)** | Tool `escalate_to_ticket` gọi sang `support-service:3009` |
| `backend/ai-service/src/services/llm-orchestrator.ts` | **Cập nhật (Ngày 8-9)** | Khai báo tool escalate, bộ lọc sentiment tự động chuyển tiếp ticket CSKH |
| `backend/ai-service/src/controllers/chat.controller.ts` | **Cập nhật (Ngày 8-9)** | Truyền thông tin email, name, sessionId sang pipeline Tool Calling |
| `backend/ai-service/src/scripts/test-day8-9.ts` | **Mới (Ngày 8-9)** | Script kiểm thử tự động toàn diện Ngày 8-9 (5/5 passed) |
| `backend/ai-service/src/tools/cart.tool.ts` | Đã hoàn thành | Tool Calling giỏ hàng |
| `backend/ai-service/src/tools/order.tool.ts` | Đã hoàn thành | Tool Calling đơn hàng & xác nhận 2 bước |
| `backend/ai-service/src/tools/promotion.tool.ts` | Đã hoàn thành | Tool Calling khuyến mãi |
| `backend/ai-service/src/tools/catalog.tool.ts` | Đã hoàn thành | Tool Calling tìm kiếm và so sánh sản phẩm |
| `docs/DU_PROGRESS_CHECKLIST.md` | **Cập nhật (Ngày 8-9)** | Báo cáo tiến độ nghiệm thu hoàn tất Ngày 8-9 |

---

## 4. KẾT LUẬN & SẴN SÀNG MERGE
- Mã nguồn nằm độc lập trong `backend/ai-service/`, không gây bất kỳ xung đột nào.
- Đã test tích hợp luồng CSKH giữa `ai-service` và `support-service` khớp 100% schema của Bạn 3 (Đức).
- Build sạch (`tsc` exit 0), sẵn sàng tạo Pull Request để merge vào `develop`.
