# THIẾT KẾ SAGA PATTERN (ORCHESTRATION) - BACKEND

Tài liệu chi tiết về việc ứng dụng **Saga Pattern (Orchestration Model)** cho luồng **Đặt hàng -> Giữ kho -> Thanh toán -> Chốt kho / Bù trừ nhả kho** đã được tổng hợp chi tiết tại:

📌 **[Tài Liệu Chi Tiết Saga Pattern (docs/SAGA_PATTERN.md)](../docs/SAGA_PATTERN.md)**

---

## 📌 1. Bảng Trạng Thái Saga Trong Quy Trình Thanh Toán (State Transition Table)

| Bước thực thi | Trạng thái Đơn hàng (Order) | Trạng thái Thanh toán (Payment) | Trạng thái Giữ hàng (Stock Reservation) | Trạng thái Kho vật lý (Product Variant) |
| :--- | :--- | :--- | :--- | :--- |
| **1. Khởi tạo** | `PENDING_PAYMENT` | `PENDING` | Chưa giữ hàng | `stock_reserved` không đổi, `stock_quantity` không đổi |
| **2. Giữ kho thành công** | `PENDING_PAYMENT` | `PENDING` | `RESERVED` | **Tăng** `stock_reserved` theo số lượng đặt |
| **3. Thanh toán thành công** | `CONFIRMED` | `SUCCESS` | `COMMITTED` | **Giảm** `stock_quantity` (xuất thật), **Giảm** `stock_reserved` (giải phóng giữ chỗ) |
| **4. Thanh toán thất bại / Hủy** | `CANCELLED` | `FAILED` hoặc `EXPIRED` | `RELEASED` | **Giảm** `stock_reserved` về ban đầu (hoàn trả kho khả dụng) |

---

## 📌 2. Phân Biệt 3 Hành Động Tồn Kho Trong Microservices (Tránh lỗi trừ kho 2 lần)

- **Reserve Stock (Giữ hàng tạm thời):**
  - **Mục đích:** Tạm giữ sản phẩm chờ thanh toán.
  - **Thao tác:** **Tăng** `stock_reserved` của biến thể. **Không** trừ `stock_quantity`. Tạo bản ghi `StockReservation` ở trạng thái `RESERVED`.
- **Commit Stock (Chốt xuất kho chính thức):**
  - **Mục đích:** Xuất hàng thực tế khi thanh toán thành công.
  - **Thao tác:** **Giảm đồng thời** `stock_quantity` (trừ tồn kho thật) và `stock_reserved` (giảm lượng giữ chỗ). Cập nhật `StockReservation` sang `COMMITTED`.
- **Release Stock (Hoàn trả tồn kho - Giao dịch bù trừ):**
  - **Mục đích:** Nhả lượng hàng giữ chỗ khi thanh toán thất bại, hết hạn hoặc hủy.
  - **Thao tác:** Chỉ **giảm** `stock_reserved`. **Không** cộng lại `stock_quantity`. Cập nhật `StockReservation` sang `RELEASED`.

---

## 📌 3. Định Nghĩa Trạng Thái Enum Trong Database

### Trạng thái Đơn hàng (`order-service`):
- `PENDING_PAYMENT`: Đã tạo đơn, chờ thanh toán.
- `CONFIRMED`: Đã xác nhận đơn hàng (Đã thanh toán hoặc thanh toán CASH).
- `SHIPPING`: Đang vận chuyển.
- `COMPLETED`: Giao hàng thành công.
- `CANCELLED`: Đã hủy đơn.

### Trạng thái Thanh toán (`payment-service`):
- `PENDING`: Đang chờ thanh toán.
- `SUCCESS`: Thanh toán thành công.
- `FAILED`: Thanh toán thất bại.
- `EXPIRED`: Giao dịch hết hạn.
- `REFUNDED`: Đã hoàn tiền.

---

## 📌 4. Tóm Tắt Vai Trò Các Microservices Trong Luồng Saga

1. **`order-service` (Orchestrator - Nhạc Trưởng):**
   - Điều phối luồng gọi API `/stock-reservations/batch`, `/commit`, `/release` sang `catalog-service` và `/payments/create` sang `payment-service`.
   - Quản lý trạng thái và kích hoạt các giao dịch bù trừ khi nhận thông báo lỗi từ cổng thanh toán.

2. **`catalog-service`:**
   - Quản lý bảng `stock_reservations` và đảm bảo **Tính luỹ đẳng (Idempotency)** cho các API.

3. **`payment-service`:**
   - Cung cấp API tạo giao dịch thanh toán và webhook đồng bộ kết quả về cho `order-service`.
