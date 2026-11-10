# CHECKLIST & TIẾN ĐỘ CÔNG VIỆC — DỰ (BẠN 1: BACKEND & AI CORE ENGINEER)

> **Tài liệu nghiệm thu công việc:** Tổng kết chi tiết các đầu việc Bạn 1 (Dự) đã hoàn thành cho giai đoạn **Ngày 1 đến Ngày 7 (Tuần 1 & Đầu Tuần 2)** theo đúng phân công trong [`docs/kehoachAIASSISTANT.md`](file:///q:/san-thuong-mai-dien-tu/docs/kehoachAIASSISTANT.md).

---

## 1. TỔNG QUAN PHÂN CÔNG CỦA BẠN 1 (DỰ)
- **Vai trò:** Backend & AI Core Engineer
- **Phạm vi phụ trách chính:** `backend/ai-service` (Port 3010), PostgreSQL `ai_db` (pgvector), LLM Orchestrator, RAG Knowledge Base Engine, Hệ thống 12 Tool Calling (Catalog, Cart, Order, Promotion), SSE Chat Streaming và API Gateway route `/ai`.

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

### ✅ Ngày 4-5 (Thứ 5-6) — TOOL CALLING & METADATA STREAMING
- [x] **Xây dựng module `catalog.tool.ts`:**
  - Tool 1 `search_products`: Tìm kiếm sản phẩm gọi `catalog-service:3002`.
  - Tool 2 `get_product_details`: Lấy chi tiết thông số kỹ thuật, cấu hình và danh sách các biến thể của sản phẩm.
  - Tool 3 `compare_products`: So sánh 2-4 sản phẩm dựa trên 7 tiêu chí phần cứng và sinh gợi ý tư vấn mua sắm `recommendation` từ AI.
- [x] **Khớp 100% Contract Frontend với Khoa:**
  - Gán chính xác `variant_id = variants[0]?.id` (UUID thật) cho toàn bộ thẻ trong `product_cards` để bấm "Thêm giỏ" hoạt động ngay.
  - Xử lý giá gốc `original_price` và tỉ lệ giảm giá `discount_percent`.

### ✅ Ngày 6-7 (Thứ 2-3 Tuần 2) — HOÀN THIỆN CART, ORDER & PROMOTION TOOLS
- [x] **Xây dựng module `cart.tool.ts`:**
  - Tool 3 `add_to_cart`: Thêm sản phẩm vào giỏ hàng (`POST cart-service:3003/api/cart/items`).
  - Tool 4 `update_cart_item`: Cập nhật số lượng sản phẩm (`PUT cart-service:3003/api/cart/items/:id`).
  - Tool 5 `remove_cart_item`: Xóa sản phẩm khỏi giỏ (`DELETE cart-service:3003/api/cart/items/:id`).
  - Tool 6 `get_cart`: Xem danh sách sản phẩm trong giỏ hàng (`GET cart-service:3003/api/cart`).
  - **Kiểm tra JWT (`x-user-id`):** Nếu khách là Guest chưa đăng nhập, AI từ chối thao tác dữ liệu riêng tư và hướng dẫn khách đăng nhập trước.
- [x] **Xây dựng module `order.tool.ts`:**
  - Tool 7 `get_orders`: Tra cứu danh sách đơn hàng (`GET order-service:3004/api/orders`).
  - Tool 8 `get_order_detail`: Xem chi tiết bưu phẩm, địa chỉ và lộ trình đơn hàng (`GET order-service:3004/api/orders/:id`).
  - Tool 9 `cancel_order`: Hủy đơn hàng kèm **Xác nhận 2 bước** (bảo vệ các đơn hàng nhạy cảm, chỉ hủy khi người dùng gõ xác nhận rõ ràng).
- [x] **Xây dựng module `promotion.tool.ts`:**
  - Tool 10 `check_promotions`: Tra cứu mã giảm giá, voucher freeship, flash sale khả dụng (`GET catalog-service:3002/api/catalog/promotions`).
- [x] **Nâng cấp `compare_products` với `highlights` (Pros/Cons):**
  - Bổ sung cấu trúc `ProductProsCons` (ưu điểm, nhược điểm) khớp 100% với component `ChatComparisonTable.tsx` mà Khoa cập nhật trên branch `feature/chat-widget-day-6-7`.
- [x] **Đấu nối toàn bộ vào `llm-orchestrator.ts` & `chat.controller.ts`:**
  - Khai báo Schema Function Declarations cho Gemini 1.5 Flash cho cả 10 Tools.
  - Nâng cấp Intent Detector thông minh để tự động nhận diện câu thoại giỏ hàng, tra cứu đơn hàng, hủy đơn, voucher.
  - Truyền `customerId` từ `req.headers['x-user-id']` vào `streamResponse`.
- [x] **Kiểm thử tự động End-to-End ([`test-day6-7.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/src/scripts/test-day6-7.ts)):**
  - Đạt **7/7 tests passed 100%**:
    1. Kiểm tra chặn khách vãng lai khi thao tác giỏ hàng.
    2. Thêm và xem giỏ hàng khi có `customerId`.
    3. Tra cứu danh sách và chi tiết đơn hàng.
    4. Hủy đơn hàng với cơ chế xác nhận 2 bước an toàn.
    5. Tra cứu danh sách mã giảm giá & voucher khả dụng.
    6. So sánh sản phẩm có kèm `highlights` ưu/nhược điểm.
    7. Tích hợp stream câu thoại AI kết nối Tool Calling.

---

## 3. DANH SÁCH FILE ĐÃ TẠO / CẬP NHẬT

| File | Trạng thái | Mô tả |
|---|---|---|
| `backend/ai-service/src/tools/cart.tool.ts` | **Mới (Ngày 6-7)** | Tool Calling giỏ hàng: `addToCart`, `getCart`, `updateCartItem`, `removeCartItem`, auth check |
| `backend/ai-service/src/tools/order.tool.ts` | **Mới (Ngày 6-7)** | Tool Calling đơn hàng: `getOrders`, `getOrderDetail`, `cancelOrder` (xác nhận 2 bước) |
| `backend/ai-service/src/tools/promotion.tool.ts` | **Mới (Ngày 6-7)** | Tool Calling khuyến mãi: `checkPromotions` tra cứu voucher |
| `backend/ai-service/src/tools/catalog.tool.ts` | **Cập nhật (Ngày 6-7)** | Thêm `highlights` (pros/cons) cho `compareProducts` khớp frontend Khoa |
| `backend/ai-service/src/services/llm-orchestrator.ts` | **Cập nhật (Ngày 6-7)** | Đấu nối 10 tools, Gemini Function Declarations, Intent Detector thông minh |
| `backend/ai-service/src/controllers/chat.controller.ts` | **Cập nhật (Ngày 6-7)** | Truyền `customerId` vào pipeline Tool Calling |
| `backend/ai-service/src/scripts/test-day6-7.ts` | **Mới (Ngày 6-7)** | Script kiểm thử tự động 7 tính năng Ngày 6-7 (7/7 passed) |
| `docs/DU_PROGRESS_CHECKLIST.md` | **Cập nhật (Ngày 6-7)** | Báo cáo tiến độ nghiệm thu hoàn tất Tuần 1 & Ngày 6-7 |

---

## 4. KẾT LUẬN & SẴN SÀNG MERGE
- Mã nguồn nằm độc lập trong `backend/ai-service/`, không xung đột với `frontend/` hay `backend/support-service/`.
- Toàn bộ service build sạch (`tsc` exit 0), đã vượt qua 100% bài test hồi quy và test mới. Sẵn sàng tạo Pull Request để merge vào `develop`.
