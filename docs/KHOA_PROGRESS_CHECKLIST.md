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

### ✅ Ngày 6-7 (Thứ 2-3) — RENDER COMPARISON TABLE & QUẢN LÝ SESSION CHAT
- [x] **Render Comparison Table (`frontend/src/components/chat/ChatComparisonTable.tsx`):**
  - Hiển thị bảng so sánh từ **2 đến 4 sản phẩm** từ `metadata` (`type: "comparison_table"`), có cột cố định (`sticky left-0`) và cuộn ngang mượt trên màn hình nhỏ.
  - Tự động phân tích số liệu từng hàng để **Highlight thông số vượt trội** (`⚡ Giá tốt nhất` cho giá thấp nhất, `⚡ Vượt trội` cho RAM/Pin/Camera/Màn hình/Sạc cao nhất).
  - Bổ sung khu vực **"Highlight Ưu / Nhược điểm từng sản phẩm"** (`ProductProsCons`): hiển thị rõ các thẻ `✓ Ưu điểm` (xanh lá) và `! Lưu ý / Nhược điểm` (vàng cam) cho mỗi sản phẩm (hỗ trợ cả dữ liệu `highlights` từ Backend lẫn tự động tổng hợp từ bảng thông số).
  - Hỗ trợ render in đậm `**bold**` trong hộp `Gợi ý từ AI` (`recommendation`).
- [x] **Quản lý Session Chat (`frontend/src/services/aiChatService.ts` & `ChatWidget.tsx`):**
  - Tự động khởi tạo và lưu trữ **Guest Session Token** (`guest-xxxxxxxx-...`) trong `localStorage` (`ai_chat_session_token`) ngay khi khách truy cập.
  - Lưu trữ lịch sử tin nhắn theo từng phiên (`ai_chat_session_msgs_<token>`) và danh sách các phiên gần nhất (`ai_chat_sessions_index`).
  - Tự động gọi `GET /api/ai/sessions/:sessionToken/messages` để đồng bộ lịch sử từ Server, đồng thời fallback về `localStorage` khi tải lại trang (`F5`).
  - Thêm **Panel Quản lý Phiên & Lịch sử Chat** ngay trên Header của `ChatWidget` (xem `session_token` hiện tại, phân biệt `Guest Session` / `User Session`, chuyển đổi giữa các phiên cũ, xóa phiên hoặc tạo phiên mới).

### ✅ Ngày 8-9 (Thứ 4-5) — TÍCH HỢP THẬT E2E VỚI BẠN 1 (`ai-service`)
- [x] **Thay Mock SSE bằng endpoint thật `/api/ai/chat` (`frontend/src/services/aiChatService.ts`):**
  - Kết nối trực tiếp tới `POST http://localhost:3000/api/ai/chat` (qua API Gateway) và tự động kết nối dự phòng sang `POST http://localhost:3010/api/ai/chat` (trực tiếp `ai-service` của Bạn 1 nếu Gateway chưa bật).
  - Bổ sung hàm `checkAiBackendHealth()` tự động kiểm tra trạng thái `Live SSE` ngay khi mở cửa sổ Chat.
  - Tự động đính kèm `Authorization: Bearer <token>`, `x-user-id` và `x-user-email` từ phiên đăng nhập thực tế để `ai-service` thực thi các Tool bảo mật (Cart, Order, Escalate Ticket).
- [x] **Test E2E: Hỏi sản phẩm → Nhận Product Cards thật:**
  - Gửi truy vấn tìm kiếm sản phẩm → nhận luồng SSE `text_chunk` + `metadata` (`type: "product_cards"`) từ `CatalogTool.searchProducts`, tự động chuẩn hóa `slug` và `variant_id` thật để điều hướng `/product/:slug` và thêm vào giỏ.
- [x] **Test E2E: Thêm giỏ hàng qua chat (`add_to_cart`, `get_cart`):**
  - **Guest (chưa đăng nhập):** Khi AI phản hồi yêu cầu đăng nhập (`🔒`), tự động hiển thị nút **`🔑 Đăng nhập ngay`** dẫn tới `/login` (đúng Mục 6.1 tài liệu kiến trúc).
  - **User (đã đăng nhập):** Khi AI thực thi xong `add_to_cart` / `update_cart_item` / `remove_cart_item`, tự động gọi `useCartStore.getState().fetchCart()` để cập nhật ngay số lượng trên icon Giỏ hàng ở Header và hiển thị nút **`🛒 Mở Giỏ hàng`** + **`📋 Kiểm tra giỏ qua AI`**.
- [x] **Test E2E: Tra cứu & Hủy đơn hàng 2 bước qua chat (`get_orders`, `get_order_detail`, `cancel_order`):**
  - Hiển thị các nút thao tác ngữ cảnh ngay dưới bong bóng chat khi tra cứu đơn hàng: **`📋 Chi tiết #<orderId>`**, **`⚠️ Yêu cầu hủy #<orderId>`**, **`📦 Quản lý đơn mua`** (`/profile`).
  - Hỗ trợ luồng **Xác nhận 2 bước khi hủy đơn (`⚠️ XÁC NHẬN HỦY ĐƠN HÀNG`)**: hiển thị 2 nút **`✅ Xác nhận hủy #<orderId>`** (gửi lệnh xác nhận bước 2) và **`❌ Giữ lại đơn`**.
  - Hỗ trợ luồng **Escalate Ticket (`Mã ticket: TK-...`)**: hiển thị nút **`🎫 Xem phiếu hỗ trợ của tôi`** điều hướng sang `/support/my-tickets` (tích hợp với trang Ticket của Bạn 3).

### ✅ Ngày 10-11 (Thứ 6-7) — POLISH UI, ANIMATION, LOADING/ERROR/EMPTY STATES & MOBILE OPTIMIZATION
- [x] **Animation mở/đóng Chat Widget (`frontend/src/components/chat/ChatWidget.tsx`):**
  - Hiệu ứng mở/đóng mượt mà hai chiều (`handleOpenWidget`, `handleCloseWidget` với state `isClosing`, `origin-bottom-right`, scale + slide + fade transition).
  - Hỗ trợ nhấn phím `Escape` để đóng nhanh panel lịch sử hoặc thu gọn cửa sổ chat.
  - Hiệu ứng xuất hiện từng bong bóng tin nhắn mới (`animate-in fade-in slide-in-from-bottom-1`).
- [x] **Loading States & Error States:**
  - **Skeleton Loading (`isLoadingHistory`):** Hiển thị khung xương shimmer kèm spinner `"Đang tải lịch sử cuộc trò chuyện..."` khi khôi phục hoặc chuyển đổi phiên chat.
  - **Error State & Retry (`hasError`, `failedPrompt`, `handleRetryMessage`):** Khi gặp lỗi kết nối/stream, hiển thị bong bóng cảnh báo màu đỏ kèm nút **`🔄 Thử gửi lại`** để gửi lại câu hỏi ngay lập tức.
  - **Network Offline Detection (`isOffline`):** Tự động lắng nghe sự kiện `online`/`offline` của trình duyệt và hiển thị thanh cảnh báo khi mất mạng.
- [x] **Empty States ("Chưa có cuộc hội thoại nào"):**
  - Hiển thị thẻ Empty State trực quan với tiêu đề **`"Chưa có cuộc hội thoại nào"`** cả ở màn hình bắt đầu cuộc trò chuyện mới lẫn trong ngăn Lịch sử phiên chat khi danh sách trống.
- [x] **Mobile Optimization:**
  - Sử dụng chiều cao động `h-[100dvh]` và `pb-[max(0.75rem,env(safe-area-inset-bottom))]` giúp thanh nhập tin nhắn luôn hiển thị chuẩn xác khi bàn phím ảo bật lên trên điện thoại.
  - Tự động khóa cuộn trang nền (`document.body.style.overflow = 'hidden'`) khi mở fullscreen chat trên mobile (`< 640px`).
  - Bổ sung nút nổi **`⬇️ Mới nhất`** (`showScrollBottomBtn`) khi người dùng cuộn ngược lên xem lịch sử dài.

### ✅ Ngày 12-13 (Thứ 2-3 Tuần 3) — HỖ TRỢ TÍCH HỢP, FIX BUG UI & HOÀN THIỆN ROUTES `/support/*`, `/admin/tickets/*`
- [x] **Hoàn thiện hệ thống Routes `/support/*` và `/admin/tickets/*` vào React Router:**
  - Trong [`frontend/src/routes/UserRoutes.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/routes/UserRoutes.tsx): cấu hình đầy đủ cụm route `/support`, `/support/new-ticket`, `/support/my-tickets`, `/support/my-tickets/:id`, `/support/tickets`, `/support/tickets/:id` và wildcard `/support/*`.
  - Trong [`frontend/src/routes/AdminRoutes.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/routes/AdminRoutes.tsx): cấu hình đầy đủ `/admin/tickets`, `/admin/tickets/:id` và wildcard `/admin/tickets/*`.
  - Trong [`frontend/src/pages/user/support/MyTickets.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/pages/user/support/MyTickets.tsx): hỗ trợ tự động mở chi tiết ticket khi truy cập trực tiếp qua URL có `:id` (`/support/my-tickets/:id`).
- [x] **Fix Bug UI & Tích hợp phát sinh:**
  - **Fix Bug #1 ([`frontend/src/lib/api-client.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/lib/api-client.ts)):** Sửa lỗi gọi sai endpoint refresh token (`/identity/auth/refresh` bị 404 làm văng đăng nhập khi thao tác trên trang Ticket) thành `/auth/refresh-token` chuẩn của hệ thống, đồng thời đính kèm header `x-user-email` từ phiên đăng nhập để `support-service` và `ai-service` nhận đúng email khách hàng.
  - **Fix Bug #2 ([`frontend/src/components/layout/AdminLayout.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/layout/AdminLayout.tsx)):** Sửa lỗi mất trạng thái active của mục **"CSKH Tickets"** trên thanh Sidebar Admin khi nhân viên bấm vào xem trang chi tiết `/admin/tickets/:id`.
  - **Fix Bug #3 ([`Header.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/layout/Header.tsx), [`Footer.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/layout/Footer.tsx), [`ProfileLayout.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/pages/user/profile/ProfileLayout.tsx)):** Bổ sung nút **"Hỗ trợ"** trên Header, mục **"Yêu cầu hỗ trợ (Tickets)"** trong Sidebar trang Cá nhân, và sửa các link chết ở Footer trỏ về `/support/my-tickets` & `/support/new-ticket`.
  - **Fix Bug #4 ([`ChatWidget.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/chat/ChatWidget.tsx)):** Khi AI escalate tạo ticket (`Mã ticket: TK-...`) hoặc hướng dẫn liên hệ CSKH, hiển thị đầy đủ các nút **`🎫 Xem phiếu hỗ trợ`**, **`➕ Tạo phiếu mới`**, và nút **`✨ CSKH Dashboard`** (`/admin/tickets` dành cho tài khoản Admin khi demo E2E).

### ✅ Ngày 14 (Thứ 4) — TỔNG KIỂM THỬ E2E 4 KỊCH BẢN & DEMO HOÀN CHỈNH
- [x] **Tích hợp sẵn 4 Kịch bản Demo chính thức vào Quick Prompts trên [`ChatWidget.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/chat/ChatWidget.tsx) & [`aiChatService.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/services/aiChatService.ts):**
  - **Kịch bản 1 (Happy Path AI Shopping):** `"📱 Tìm điện thoại dưới 15 triệu"` → render Product Cards → `"⚖️ So sánh iPhone 15 và Samsung S24"` → render Comparison Table → `"🛒 Thêm iPhone 15 vào giỏ"` → thêm giỏ hàng & đồng bộ Header Cart.
  - **Kịch bản 2 (AI Chat Escalate to Ticket):** `"😡 Đơn hàng 5 ngày chưa giao, các bạn lừa đảo à?"` → nhận diện khách bức xúc → tự động tạo ticket `P1 / ANGRY` kèm nút mở nhanh **`🎫 Xem phiếu hỗ trợ`** và **`✨ CSKH Dashboard`** (`/admin/tickets`).
  - **Kịch bản 3 (Form Ticket thủ công):** Điều hướng từ Header (`🎧 Hỗ trợ`) / Footer / Profile / Chat Widget sang `/support/new-ticket` → tạo ticket → theo dõi tại `/support/my-tickets` và duyệt tại `/admin/tickets/:id`.
  - **Kịch bản 4 (RAG Chính sách & Chống Hallucination):** `"🔄 Chính sách đổi trả hàng như thế nào?"` (trả lời đúng chính sách 7 ngày) và `"🚫 Sàn có bán vũ khí không?"` (từ chối lịch sự, không bịa đặt thông tin, hướng dẫn liên hệ Hotline `1900-6868` hoặc tạo phiếu hỗ trợ).
- [x] **Đánh dấu hoàn thành 100% Checklist của Bạn 2 trong [`docs/kehoachAIASSISTANT.md`](file:///q:/san-thuong-mai-dien-tu/docs/kehoachAIASSISTANT.md#L303-L310).**

---

## 3. DANH SÁCH FILE ĐÃ TẠO / CẬP NHẬT

| File | Trạng thái | Mô tả |
|---|---|---|
| [`frontend/src/types/aiChat.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/types/aiChat.ts) | Hoàn tất (Ngày 1-14) | Định nghĩa đầy đủ kiểu dữ liệu SSE, `ChatMessage`, `ProductCardItem`, `ComparisonTableMetadata`, `ProductProsCons`, `ChatSessionSummary` |
| [`frontend/src/services/aiChatService.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/services/aiChatService.ts) | Hoàn tất (Ngày 1-14) | SSE Client (`EventSource` + `ReadableStream`), kết nối `/api/ai/chat` (Gateway `:3000` + Direct `:3010`), quản lý Session LocalStorage & 4 kịch bản Demo E2E |
| [`frontend/src/components/chat/ChatWidget.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/chat/ChatWidget.tsx) | Hoàn tất (Ngày 1-14) | Cửa sổ Chat nổi, Responsive Mobile `100dvh`, Animation mở/đóng, Skeleton/Error/Empty states, Session Switcher, Quick Prompts & Context Action Buttons |
| [`frontend/src/components/chat/ChatProductCard.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/chat/ChatProductCard.tsx) | Hoàn tất (Ngày 4-5) | Product Action Card với ảnh, giá gốc gạch ngang, badge `-%`, nút **"Xem chi tiết"** (`/product/:slug`) và nút **"Thêm giỏ"** (loading/success state) |
| [`frontend/src/components/chat/ChatComparisonTable.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/chat/ChatComparisonTable.tsx) | Hoàn tất (Ngày 6-7) | Bảng so sánh 2-4 sản phẩm, tự động highlight ô thông số tốt nhất + khu vực **Highlight Ưu/Nhược điểm mỗi sản phẩm** |
| [`frontend/src/services/productService.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/services/productService.ts) | Hoàn tất (Ngày 4-5) | Bổ sung `getProductBySlug()` và hỗ trợ `getProductById(idOrSlug)` nhận cả UUID lẫn `slug` |
| [`frontend/src/routes/UserRoutes.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/routes/UserRoutes.tsx) | Hoàn tất (Ngày 12-13) | Hoàn thiện cụm route `/support/*` và `/product/:slug` |
| [`frontend/src/routes/AdminRoutes.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/routes/AdminRoutes.tsx) | Hoàn tất (Ngày 12-13) | Hoàn thiện cụm route `/admin/tickets/*` |
| [`frontend/src/components/layout/AdminLayout.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/layout/AdminLayout.tsx) | Hoàn tất (Ngày 12-13) | Fix active highlight trên Sidebar cho các route con `/admin/tickets/:id` |
| [`frontend/src/components/layout/Header.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/layout/Header.tsx) | Hoàn tất (Ngày 12-13) | Thêm nút điều hướng nhanh **Hỗ trợ CSKH** (`/support/my-tickets`) trên thanh Header |
| [`frontend/src/components/layout/Footer.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/layout/Footer.tsx) | Hoàn tất (Ngày 12-13) | Cập nhật các liên kết Hỗ trợ khách hàng trỏ về `/support/my-tickets` và `/support/new-ticket` |
| [`frontend/src/pages/user/profile/ProfileLayout.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/pages/user/profile/ProfileLayout.tsx) | Hoàn tất (Ngày 12-13) | Thêm mục **Yêu cầu hỗ trợ (Tickets)** trong menu tài khoản khách hàng |
| [`frontend/src/pages/user/support/MyTickets.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/pages/user/support/MyTickets.tsx) | Hoàn tất (Ngày 12-13) | Hỗ trợ mở tự động chi tiết ticket từ tham số `:id` trên URL |
| [`frontend/src/lib/api-client.ts`](file:///q:/san-thuong-mai-dien-tu/frontend/src/lib/api-client.ts) | Hoàn tất (Ngày 12-13) | Fix lỗi refresh token `/auth/refresh-token` và bổ sung header `x-user-email` |
| [`frontend/src/components/layout/UserLayout.tsx`](file:///q:/san-thuong-mai-dien-tu/frontend/src/components/layout/UserLayout.tsx) | Hoàn tất (Ngày 2-3) | Nhúng `<ChatWidget />` vào layout khách hàng |
| [`docs/NOTES_CHO_DU_BAN1.md`](file:///q:/san-thuong-mai-dien-tu/docs/NOTES_CHO_DU_BAN1.md) | Hoàn tất (Ngày 1) | Tài liệu chốt API Contract (SSE + Metadata) và lưu ý kỹ thuật gửi cho Dự (Bạn 1) |

---

## 4. TỔNG KẾT TIẾN ĐỘ (NGÀY 1 → NGÀY 14)

- [x] **Hoàn tất 100% toàn bộ hạng mục từ Ngày 1 đến Ngày 14 của Khoa (Bạn 2 — Frontend & UX Engineer).**
- [x] **Sẵn sàng Demo cuối kỳ toàn bộ 4 kịch bản End-to-End.**

