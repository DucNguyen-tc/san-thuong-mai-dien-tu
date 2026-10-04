# TÀI LIỆU KỸ THUẬT: MODULE BÁO CÁO DOANH THU TỰ ĐỘNG QUA TELEGRAM BOT

## 1. Mục Tiêu và Ý Nghĩa
Xây dựng một tiến trình chạy nền (Background Worker / Cron Job) viết trực tiếp bằng mã nguồn hệ thống (Node.js), tự động gửi báo cáo tóm tắt tình hình kinh doanh hàng ngày tới ứng dụng Telegram của Quản trị viên (Admin). 
Việc này giúp Admin nắm bắt số liệu kinh doanh một cách nhanh chóng, bảo mật, độc lập mà không phụ thuộc vào công cụ kéo thả của bên thứ ba (như Zapier, Make, v.v.).

## 2. Mô Tả Các Chức Năng Chi Tiết

### 2.1. Lập lịch báo cáo định kỳ tự động
- **Công nghệ:** Sử dụng thư viện `node-cron` được nhúng trực tiếp vào trong `order-service`.
- **Cơ chế:** Kích hoạt vào một khung giờ cố định mỗi ngày. Mặc định là **23:00 đêm** (`0 23 * * *`).
- **Phạm vi dữ liệu:** Tổng hợp dữ liệu từ `00:00:00` đến `23:59:59` của ngày hiện tại.

### 2.2. Nội dung báo cáo kinh doanh tổng hợp
Tin nhắn Telegram được định dạng HTML/Markdown sinh động, rõ ràng với các chỉ số trọng yếu:
- 📦 **Tổng số đơn hàng:** Đếm tất cả đơn hàng phát sinh trong ngày.
- 🎯 **Tỷ lệ thành công:** Phân tích % đơn hàng có trạng thái `COMPLETED` so với tổng đơn.
- 💰 **Tổng doanh thu thực tế:** Tổng giá trị (`total_amount`) của các đơn đã thanh toán thành công.
- 🏆 **Top 3 sản phẩm bán chạy nhất:** Thống kê từ `order_items` các sản phẩm có tổng số lượng bán (`quantity`) cao nhất trong ngày.
- ❌ **Số lượng đơn thất bại/hủy:** Đếm các đơn hàng có trạng thái `CANCELLED` (do người dùng hủy hoặc hệ thống timeout).

### 2.3. Cơ chế bảo mật và vận hành độc lập
- **Bảo mật danh tính:** `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` được lưu trữ an toàn trong file `.env` của `order-service`. Không hard-code trong mã nguồn.
- **Tự động thử lại (Retry Mechanism):** Nếu có lỗi mạng tạm thời hoặc bị giới hạn rate limit (HTTP 429) từ API Telegram, tiến trình tự động chờ (ví dụ 5 giây) và thực hiện gửi lại (tối đa 3 lần) bằng khối `try-catch`.

---

## 3. Các Bước Thực Hiện (Implementation Plan)

### Bước 1: Khai báo biến môi trường (Environment Variables)
Bổ sung các biến sau vào `.env` của `order-service`:
```env
TELEGRAM_BOT_TOKEN="your_bot_token_here"
TELEGRAM_CHAT_ID="your_chat_id_here"
TELEGRAM_REPORT_CRON="0 23 * * *"
```

### Bước 2: Xây dựng Service tổng hợp số liệu
Tạo file `src/services/report.service.ts` (hoặc tái sử dụng `stats.service.ts` nếu có).
- Khởi tạo 2 biến thời gian: `startOfDay` và `endOfDay`.
- Dùng Prisma truy vấn:
  1. Tổng số đơn hàng (Count all).
  2. Tổng doanh thu (Aggregate sum cho đơn `COMPLETED`).
  3. Tổng đơn huỷ (Count `CANCELLED`).
  4. Top 3 sản phẩm (Group by `product_id` từ `order_items`).

### Bước 3: Tích hợp API Telegram Bot
Tạo file `src/utils/telegram.util.ts`:
- Hàm `sendTelegramMessage(htmlContent)`: Dùng `fetch` hoặc `axios` gọi POST tới `https://api.telegram.org/bot<TOKEN>/sendMessage`.
- Cấu hình body: `{ chat_id: process.env.TELEGRAM_CHAT_ID, text: htmlContent, parse_mode: 'HTML' }`.
- Thêm logic vòng lặp 3 lần thử lại (Retry) khi API báo lỗi.

### Bước 4: Thiết lập Cron Job
Tạo file `src/cron/daily-report.cron.ts`:
- Import thư viện `node-cron`.
- Lập lịch gọi `report.service.ts` -> sinh HTML template -> truyền vào `telegram.util.ts`.
- Đăng ký cron job này trong hàm khởi tạo của `app.ts` hoặc `server.ts`.

---

## 4. Kết Quả Đạt Được
- **Quản trị Real-time:** Admin luôn có số liệu tóm tắt kinh doanh gửi thẳng vào điện thoại vào cuối ngày mà không cần mở máy tính hay đăng nhập vào Dashboard.
- **Chi phí 0đ:** Không phát sinh chi phí duy trì Webhook hay dịch vụ bên ngoài. API Telegram hoàn toàn miễn phí.
- **Không thay đổi CSDL:** Toàn bộ dữ liệu đều tận dụng cấu trúc hiện tại của `order-service` (Bảng `orders`, `order_items`). An toàn 100% đối với hệ thống lõi.
