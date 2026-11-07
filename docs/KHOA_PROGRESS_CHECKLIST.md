# CHECKLIST & TIẾN ĐỘ CÔNG VIỆC — KHOA (BẠN 2: FRONTEND & UX ENGINEER)

> **Hướng dẫn sử dụng (Khi bắt đầu phiên mới hoặc sau khi hết quota):**
> Đọc file này đầu tiên để nắm ngay những việc Khoa (Bạn 2) đã hoàn thành, danh sách các file đã tạo/chỉnh sửa, và phần việc tiếp theo cần làm theo đúng kế hoạch trong [`docs/kehoachAIASSISTANT.md`](file:///q:/san-thuong-mai-dien-tu/docs/kehoachAIASSISTANT.md).

---

## 1. TỔNG QUAN PHÂN CÔNG CỦA KHOA (BẠN 2)
- **Vai trò:** Frontend & UX Engineer
- **Phạm vi phụ trách chính:** `frontend/` (Chat Widget React, SSE Streaming Client, Product Action Cards, Comparison Table, Session Management, Responsive Mobile Fullscreen, và phối hợp thêm route `/support/*`, `/admin/tickets/*` cùng Bạn 3 ở cuối Tuần 2).

---

## 2. TRẠNG THÁI TIẾN ĐỘ THEO NGÀY

### ✅ Ngày 1 (Thứ 2) — KICK-OFF, CHỐT CONTRACT & SETUP SSE/MOCK
- [x] Rà soát API Contract giữa Bạn 1 (Dự) ↔ Bạn 2 (Khoa): SSE Stream Format (`session`, `text_chunk`, `metadata`, `done`, `error`) và JSON Schema cho `product_cards` & `comparison_table`.
- [x] Ghi chú toàn bộ nội dung thảo luận & lưu ý kỹ thuật cho Dự tại [`docs/NOTES_CHO_DU_BAN1.md`](file:///q:/san-thuong-mai-dien-tu/docs/NOTES_CHO_DU_BAN1.md).
- [x] Xây dựng bộ giả lập **Mock SSE Stream** tích hợp trực tiếp trong [`frontend/src/services/aiChatService.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/services/aiChatService.ts) (tự động kích hoạt khi Backend `ai-service` chưa bật hoặc bấm nút chuyển đổi `Mock SSE / Live SSE` ngay trên Header của Chat Widget).
- [x] Xây dựng SSE Client dùng `fetch()` + `ReadableStream` (`response.body.getReader()` + `TextDecoder`) hỗ trợ gọi `POST /api/ai/chat` có đính kèm JWT Token và `session_token`.

### ✅ Ngày 2-3 (Thứ 3-4) — XÂY DỰNG CHAT WIDGET & RESPONSIVE
- [x] Tạo Floating Action Button (FAB) ở góc phải dưới màn hình với biểu tượng AI Bot và chấm xanh hoạt động.
- [x] Xây dựng cửa sổ Chat (`ChatWidget.tsx`) với giao diện Bubble Messages (User bên phải, AI bên trái).
- [x] Thiết kế Header (tên trợ lý, trạng thái kết nối Live/Mock SSE, nút làm mới phiên chat, nút đóng), thanh Input (hỗ trợ nhấn `Enter` để gửi, nút Dừng stream khi AI đang trả lời) và các chip gợi ý câu hỏi nhanh (Quick Prompts).
- [x] **Responsive:** Trên màn hình di động tự động hiển thị toàn màn hình (`fixed inset-0 w-full h-full`), trên Desktop hiển thị khung nổi (`sm:w-[400px] sm:h-[620px]`).
- [x] Tích hợp **Typing Indicator** (3 chấm nhảy khi chờ phản hồi) + con trỏ streaming + **Auto-scroll** tự động cuộn mượt xuống tin nhắn mới nhất.
- [x] Nhúng `<ChatWidget />` vào [`frontend/src/components/layout/UserLayout.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/layout/UserLayout.tsx).

### ✅ Ngày 4-5 (Thứ 5-6) — KẾT NỐI SSE STREAMING & RENDER PRODUCT ACTION CARDS
- [x] **Tích hợp EventSource API & SSE Streaming (`frontend/src/services/aiChatService.ts`):**
  - Bổ sung hàm `connectEventSourceStream()` sử dụng chuẩn Browser `EventSource` API kết hợp cùng `streamChatMessage()` (`fetch` + `ReadableStream` cho `POST /api/ai/chat`).
  - Xây dựng bộ điều phối gói tin `dispatchSSEPacket()` phân biệt rõ các Message Type: `session`, `text_chunk`, `metadata`, `done`, `error` và cập nhật trạng thái luồng (`SSEConnectionState`: `connecting` → `streaming_text` → `receiving_metadata` → `done`).
  - Hỗ trợ render text theo từng chunk (hiệu ứng chữ chạy realtime kèm format in đậm `**bold**` mượt mà).
- [x] **Render Product Action Cards (`frontend/src/components/chat/ChatProductCard.tsx`):**
  - Hiển thị đầy đủ: Ảnh thumbnail (có fallback khi lỗi ảnh), badge danh mục, badge trạng thái `Còn hàng / Hết hàng`, tên sản phẩm (2 dòng), giá bán + giá gốc gạch ngang + badge giảm giá `-%`.
  - Nút **"Xem chi tiết"**: điều hướng chuẩn tới `/product/:slug` (đã bổ sung route `/product/:id` trong `UserRoutes.tsx` và hỗ trợ tìm sản phẩm theo `slug` hoặc `UUID` trong `productService.ts` để không bị 404). Tự động đóng khung chat fullscreen trên mobile khi chuyển trang.
  - Nút **"Thêm giỏ"**: có trạng thái loading (`Đang thêm`) và xác nhận (`Đã thêm`), tự động đồng bộ `variant_id` thật từ `catalog-service` theo `slug` để thêm thẳng vào `useCartStore` hoặc gửi lệnh chat cho AI.

### ✅ Ngày 6-7 (Đã hoàn thành sẵn khung UI & Logic)
- [x] Xây dựng component [`ChatComparisonTable.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/chat/ChatComparisonTable.tsx): hiển thị bảng so sánh 2-4 sản phẩm và hộp gợi ý `recommendation` từ AI.
- [x] Quản lý Session Chat: lưu `ai_chat_session_token` và cache lịch sử vào `localStorage`, đồng thời gọi `GET /api/ai/sessions/:sessionToken/messages` khi mở lại trang.

---

## 3. DANH SÁCH FILE ĐÃ TẠO / CẬP NHẬT

| File | Trạng thái | Mô tả |
|---|---|---|
| [`frontend/src/types/aiChat.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/types/aiChat.ts) | Đã cập nhật (Ngày 4-5) | Định nghĩa `SSEMessageType`, `SSEConnectionState`, `SSEEventPacket`, `ChatMessage`, `ProductCardItem`, `ProductCardsMetadata`, `ComparisonTableMetadata` |
| [`frontend/src/services/aiChatService.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/services/aiChatService.ts) | Đã cập nhật (Ngày 4-5) | Tích hợp `EventSource` API (`connectEventSourceStream`), `dispatchSSEPacket`, `streamChatMessage`, tự động đồng bộ `slug` & `variant_id` thật từ `catalog-service` |
| [`frontend/src/components/chat/ChatProductCard.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/chat/ChatProductCard.tsx) | Đã cập nhật (Ngày 4-5) | Product Action Card với ảnh, giá gốc gạch ngang, badge `-%`, nút **"Xem chi tiết"** (`/product/:slug`) và nút **"Thêm giỏ"** (loading/success state) |
| [`frontend/src/components/chat/ChatComparisonTable.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/chat/ChatComparisonTable.tsx) | Đã tạo | Component hiển thị bảng so sánh sản phẩm (`comparison_table`) |
| [`frontend/src/components/chat/ChatWidget.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/chat/ChatWidget.tsx) | Đã cập nhật (Ngày 4-5) | Hiển thị trạng thái pha stream (`streaming_text` vs `receiving_metadata`), format rich text `**bold**`, xử lý thêm giỏ hàng bằng `slug`/`variant_id` thật |
| [`frontend/src/services/productService.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/services/productService.ts) | Đã cập nhật (Ngày 4-5) | Bổ sung `getProductBySlug()` và hỗ trợ `getProductById(idOrSlug)` nhận cả UUID lẫn `slug` |
| [`frontend/src/routes/UserRoutes.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/routes/UserRoutes.tsx) | Đã cập nhật (Ngày 4-5) | Thêm route `/product/:id` song song với `/products/:id` để nút **"Xem chi tiết"** (`/product/:slug`) hoạt động chuẩn xác |
| [`frontend/src/components/layout/UserLayout.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/layout/UserLayout.tsx) | Đã cập nhật | Nhúng `<ChatWidget />` vào layout khách hàng |
| [`docs/NOTES_CHO_DU_BAN1.md`](file:///q:/san-thuong-mai-dien-tu/docs/NOTES_CHO_DU_BAN1.md) | Đã tạo | Tài liệu chốt API Contract (SSE + Metadata) và lưu ý kỹ thuật gửi cho Dự (Bạn 1) |

---

## 4. CÔNG VIỆC TIẾP THEO (TUẦN 2: NGÀY 8 - 14)

- [ ] **Ngày 8-9 (Tích hợp E2E với Bạn 1):**
  - Khi Dự (Bạn 1) hoàn thiện xong 12 Tools thật (`search_products`, `add_to_cart`, `get_orders`, `cancel_order`, `compare_products`), tiến hành test E2E trực tiếp ở chế độ `Live SSE`.
  - Đồng bộ lại giỏ hàng trên Header (`useCartStore.getState().fetchCart()`) khi AI thực hiện xong tool `add_to_cart` / `update_cart_item` / `remove_cart_item` từ phía Backend.
- [ ] **Ngày 10-11 (Polish UI):**
  - Tinh chỉnh hiển thị Markdown cơ bản (in đậm `**text**`, danh sách gạch đầu dòng) trong tin nhắn của AI nếu LLM trả về nhiều định dạng Markdown.
  - Kiểm tra thêm các trạng thái rỗng / mất kết nối mạng.
- [ ] **Ngày 12-13 (Phối hợp với Bạn 3 - Đức):**
  - Thêm các route `/support/*` (`/support/new-ticket`, `/support/my-tickets`) vào `UserRoutes.tsx` và `/admin/tickets/*` vào `AdminRoutes.tsx` khi Bạn 3 hoàn thành các trang Ticket UI.

