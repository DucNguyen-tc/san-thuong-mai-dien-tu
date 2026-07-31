# Hướng Dẫn Test Luồng SAGA - Đặt Hàng & Thanh Toán

Tài liệu này hướng dẫn QA/Developer cách test toàn bộ luồng Saga Pattern (Bao gồm Order Orchestration, Webhook Thanh toán và Gửi Email qua RabbitMQ).

## 🛠 Chuẩn bị Môi trường

Trước khi test, hãy đảm bảo tất cả các microservices và cơ sở hạ tầng đã được bật:

1. **PostgreSQL**: Đang chạy ở cổng `5432` (Cần có các DB: `catalog_db`, `cart_db`, `order_db`, `identity_db`, `payment_db`, `notification_db`).
2. **RabbitMQ**: Đang chạy ở cổng `5672` (Giao diện web ở `http://localhost:15672`).
3. **Các Services**: Bật tất cả các service (chạy `npm run dev` ở từng thư mục): `api-gateway`, `identity-service`, `catalog-service`, `cart-service`, `order-service`, `payment-service`, `notification-service`.
4. Lấy một **Access Token** hợp lệ của người dùng (Customer) để truyền vào header `Authorization: Bearer <TOKEN>` khi test trên Postman.

---

## 🟢 Kịch bản 1: Đặt hàng thành công bằng Tiền mặt (CASH) - _Happy Path_

**Mục tiêu test:** Kiểm tra khả năng tạo đơn, giữ kho (Reserve), chốt kho ngay lập tức (Commit), xóa giỏ hàng và bắn sự kiện email (RabbitMQ).

### Các bước thực hiện:

1. **Chuẩn bị kho**: Dùng API của `catalog-service` đảm bảo Sản phẩm A có `stock_quantity = 10` và `stock_reserved = 0`.
2. **Tạo đơn hàng**: Gọi API `POST http://localhost:3000/api/orders`
   ```json
   {
     "payment_method": "CASH",
     "shipping_address": "123 Đường ABC, Quận 1, TP.HCM",
     "items": [
       {
         "product_id": "<ID_SP>",
         "variant_id": "<ID_VARIANT>",
         "quantity": 2
       }
     ]
   }
   ```
3. **Kết quả mong đợi**:
   - Trả về status `200 OK`, `status` đơn hàng là `CONFIRMED`.
   - **DB Catalog**: `stock_quantity` giảm còn `8`, `stock_reserved` vẫn là `0` (Đã reserve và commit ngay lập tức).
   - **DB Notification**: Trong bảng `notifications` xuất hiện một bản ghi trạng thái `SENT`.
   - **Email**: Khách hàng nhận được email xác nhận đơn hàng qua Gmail.

## -> Đã test: Kết quả hoàn thành

## 🟡 Kịch bản 2: Đặt hàng qua VNPAY/MoMo - _Asynchronous Webhook_

**Mục tiêu test:** Kiểm tra luồng tạo đơn (trạng thái Pending), giữ kho (Reserve), và luồng nhận Webhook/IPN để hoàn tất đơn hàng.

### Các bước thực hiện:

1. **Tạo đơn hàng**: Gọi API `POST /api/orders/create` với `"payment_method": "VNPAY"`.
2. **Kết quả tạo đơn**:
   - Trả về HTTP 200 kèm `payment_url`.
   - Đơn hàng ở trạng thái `PENDING_PAYMENT`.
   - **DB Catalog**: Sản phẩm có `stock_reserved` tăng lên 2 (Ví dụ: `stock_quantity: 10`, `stock_reserved: 2`).
3. **Mô phỏng Webhook (IPN)**:
   - Dùng Postman giả lập gửi request `GET` đến `payment-service` endpoint: `http://localhost:3000/api/payments/vnpay/ipn?vnp_ResponseCode=00&vnp_TxnRef=<ORDER_ID>&vnp_SecureHash=...` (Cần tạo chữ ký Hash đúng, hoặc tạm tắt check hash lúc debug).
4. **Kết quả mong đợi sau IPN**:
   - IPN trả về `{ "RspCode": "00", "Message": "Confirm Success" }`.
   - **DB Order**: Trạng thái đơn đổi thành `CONFIRMED`.
   - **DB Catalog**: `stock_quantity` bị trừ đi 2, `stock_reserved` giảm đi 2.
   - **RabbitMQ**: Đơn vị Notification nhận được tin nhắn và gửi email báo thành công.

---

--> Đã test: Hoàn thành

## 🔴 Kịch bản 3: Hết Hàng (Out of Stock) - _Compensation/Rollback_

**Mục tiêu test:** Đảm bảo hệ thống tự động Rollback (từ chối đơn hàng) nếu kho không đủ.

### Các bước thực hiện:

1. **Kiểm tra kho**: Giả sử sản phẩm A chỉ còn khả dụng 1 cái (`stock_quantity = 5`, `stock_reserved = 4` $\rightarrow$ Khả dụng = 1).
2. **Tạo đơn hàng**: Gọi API tạo đơn mua 2 sản phẩm A.
3. **Kết quả mong đợi**:
   - API trả về lỗi `400 Bad Request` với message: `"Sản phẩm không đủ hàng tồn kho"`.
   - Không có đơn hàng nào được lưu vào DB (Hoặc có nhưng ở trạng thái `CANCELLED`).
   - Tồn kho bên `catalog-service` không bị thay đổi.
   - Không có email nào được gửi.

---

## 🔴 Kịch bản 4: Hủy đơn hàng / Thanh toán thất bại - _Compensation (Release)_

**Mục tiêu test:** Nếu khách hàng không thanh toán hoặc bấm nút Hủy đơn, hệ thống phải nhả tồn kho (Release) về lại trạng thái ban đầu.

### Các bước thực hiện:

1. **Tạo đơn hàng**: Đặt hàng qua VNPAY thành công $\rightarrow$ Đơn hàng ở trạng thái `PENDING_PAYMENT`. Tồn kho bị treo (Reserve).
2. **Thanh toán thất bại**: Dùng Postman gọi API IPN để giả lập VNPAY báo thất bại (Mã lỗi 24):
   `GET http://localhost:3000/api/payments/callback/vnpay?vnp_ResponseCode=24&vnp_TxnRef=<ORDER_ID>&isMock=true`
3. **Kết quả mong đợi**:
   - Trạng thái đơn hàng đổi thành `CANCELLED`.
   - Giao dịch thanh toán đổi thành `FAILED`.
   - **DB Catalog**: Số lượng `stock_reserved` bị trừ đi tương ứng (hoàn trả lại kho). Tồn kho khả dụng quay về như cũ.

---

## 💡 Các Mẹo Debug khi Lỗi:

- **Lỗi Email không gửi được**: Kiểm tra file `.env` của `notification-service` xem có sai mật khẩu `EMAIL_PASS` (App Password của Gmail) hay không.
- **Lỗi không trừ kho**: Xem log ở `order-service`, nếu thấy "Failed to reserve stock", có thể do `CATALOG_SERVICE_URL` cấu hình sai cổng.
- **Lỗi IPN Webhook**: VNPAY yêu cầu phản hồi `{"RspCode": "00"}`. Nếu log `payment-service` báo lỗi `Invalid Checksum`, hãy đảm bảo `VNP_HASH_SECRET` trùng khớp giữa lúc tạo URL và lúc nhận IPN.
