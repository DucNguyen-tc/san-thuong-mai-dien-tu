# GHI CHÚ THẢO LUẬN API CONTRACT: KHOA (BẠN 2 - FRONTEND) ↔ DỰ (BẠN 1 - AI SERVICE)

Tài liệu này ghi lại thống nhất về **SSE Stream Format** và **Product Card / Comparison Table Metadata** dựa trên [`docs/AI_SHOPPING_ASSISTANT_AND_RAG.md`](file:///q:/san-thuong-mai-dien-tu/docs/AI_SHOPPING_ASSISTANT_AND_RAG.md) (Mục 5.2 - 5.3) và code thực tế Dự đã viết tại [`backend/ai-service/src/controllers/chat.controller.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/src/controllers/chat.controller.ts).

---

## 1. Hợp đồng SSE Stream (`POST /api/ai/chat`)

### 1.1. Request từ Frontend (Khoa) gửi lên
- **Endpoint qua API Gateway:** `POST http://localhost:3000/api/ai/chat`
- **Headers:**
  - `Content-Type: application/json`
  - `Accept: text/event-stream`
  - `Authorization: Bearer <access_token>` *(nếu khách đã đăng nhập; nếu Guest thì không có header này, Gateway dùng `optionalToken` tự động cho qua)*
- **Body JSON:**
  ```json
  {
    "message": "Tìm điện thoại chụp ảnh đẹp tầm 15 triệu",
    "session_token": "uuid-hoac-undefined-neu-moi"
  }
  ```
- **Cách Frontend đọc SSE:** Do endpoint là `POST` có gửi kèm JSON body và `Authorization` header, trình duyệt không dùng `new EventSource()` (chỉ hỗ trợ `GET`) mà Frontend của Khoa đã dùng `fetch()` + `ReadableStream` (`response.body.getReader()`) để parse trực tiếp các dòng `event:` và `data:`.

### 1.2. Các SSE Events từ Backend (Dự) trả về
Frontend của Khoa đã xử lý khớp 100% với hàm `sendEvent(event, data)` trong [`chat.controller.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/src/controllers/chat.controller.ts#L95-L216) của Dự:

| Thứ tự | Tên Event (`event:`) | Cấu trúc `data:` (JSON) | Cách Frontend xử lý |
|---|---|---|---|
| 1 | `event: session` | `{"session_id": "...", "session_token": "..."}` | Lưu `session_token` vào `localStorage` (`ai_chat_session_token`) để giữ phiên ở các lượt chat sau và khi F5. |
| 2 | `event: message` | `{"type": "text_chunk", "content": "..."}` | Nối từng chunk vào bubble tin nhắn đang stream của AI (hiệu ứng chữ chạy realtime). |
| 3 | `event: message` | `{"type": "metadata", "payload": { ... }}` | Gắn `payload` vào `message.metadata` để render **Product Cards** hoặc **Comparison Table** ngay bên dưới văn bản. |
| 4 | `event: done` | `{"type": "done"}` | Kết thúc trạng thái streaming, ẩn con trỏ nhấp nháy. |
| 5 | `event: error` | `{"message": "..."}` | Hiển thị thông báo lỗi thân thiện trên khung chat. |

---

## 2. Hợp đồng Schema `metadata` (Product Cards & Comparison Table)

### 2.1. Product Action Cards (`payload.type === "product_cards"`)
```json
{
  "type": "product_cards",
  "products": [
    {
      "id": "44125e28-653e-4724-96d0-3dd405e85992",
      "name": "iPhone 15 Pro Max 256GB",
      "slug": "iphone-15-pro-max-256gb",
      "image_url": "https://...",
      "price": 28990000,
      "original_price": 32990000,
      "discount_percent": 12,
      "category": "Điện thoại",
      "in_stock": true,
      "variant_id": "uuid-variant-mac-dinh"
    }
  ]
}
```

### 2.2. Comparison Table (`payload.type === "comparison_table"`)
```json
{
  "type": "comparison_table",
  "products": ["iPhone 15 Pro Max", "Samsung Galaxy S24 Ultra"],
  "attributes": [
    { "name": "Giá", "values": ["28.990.000đ", "31.990.000đ"] },
    { "name": "Màn hình", "values": ["6.7\" OLED", "6.8\" AMOLED"] },
    { "name": "RAM", "values": ["8GB", "12GB"] },
    { "name": "Pin", "values": ["4422mAh", "5000mAh"] }
  ],
  "recommendation": "Samsung Galaxy S24 Ultra phù hợp hơn nếu bạn cần pin lâu và RAM lớn."
}
```

---

## 3. Các điểm lưu ý nhỏ nhờ Dự (Bạn 1) chú ý khi làm Ngày 4-5 & Tuần 2

1. **Trường `variant_id` trong `product_cards`:**
   - Khi Dự thay hàm mock `getProductMetadata` bằng dữ liệu thật gọi từ `catalog-service` (Tool `search_products`), nhờ Dự lấy luôn `variants[0]?.id` gán vào `variant_id` của mỗi sản phẩm trong `products[]`.
   - Khi có `variant_id` (UUID thật), nút **"Thêm giỏ"** trên Product Card của Khoa sẽ thêm thẳng vào giỏ hàng (`cart-service`) cực mượt. Nếu thiếu hoặc là ID giả lập thì UI của Khoa sẽ tự động fallback sang gửi tin nhắn yêu cầu AI gọi tool `add_to_cart`.
2. **Trường `original_price` và `discount_percent`:**
   - Nếu sản phẩm không có chương trình khuyến mãi, Dự cứ trả `original_price: null` và `discount_percent: 0` (hoặc lược bỏ), UI của Khoa đã check `original_price > price` mới hiển thị giá gạch ngang và badge `-%`.
3. **API Lấy lịch sử (`GET /api/ai/sessions/:sessionToken/messages`):**
   - Dự đã viết sẵn endpoint này trong [`chat.controller.ts`](file:///q:/san-thuong-mai-dien-tu/backend/ai-service/src/controllers/chat.controller.ts#L224-L260) trả về `{ success: true, data: { session, messages } }`. Khoa đã kết nối hàm `fetchSessionHistory` khớp đúng cấu trúc này.
4. **⚠️ Lưu ý lỗi cú pháp nhỏ ở `api-gateway` (do merge conflict PR #31):**
   - Trong file [`backend/api-gateway/src/routes.ts`](file:///q:/san-thuong-mai-dien-tu/backend/api-gateway/src/routes.ts#L55-L63) dòng 55-58:
     ```ts
     router.use(
       "/support/health",
       createProxyMiddleware(proxyOptions(env.SUPPORT_SERVICE_URL)),
     // <-- Đang bị thiếu dòng `);` ở đây trước khi sang router.use("/ai", ...)
     ```
   - Khi chạy `api-gateway` nếu gặp lỗi biên dịch ở dòng 59 thì chỉ cần thêm `);` vào dòng 58 là hết lỗi.

