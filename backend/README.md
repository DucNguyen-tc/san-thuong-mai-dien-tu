# Hướng Dẫn Thiết Lập & Phát Triển Backend (Microservices)

Hệ thống backend được thiết kế theo kiến trúc **Microservices** sử dụng **Express.js**, **TypeScript**, **PostgreSQL** và **Prisma ORM**. 

---

## 📂 Danh Sách Các Services

Thư mục `backend` chứa các microservices độc lập sau:

1.  **`api-gateway`**: Cổng tiếp nhận và định tuyến các request từ Frontend đến các service tương ứng.
2.  **`identity-service`**: Quản lý tài khoản người dùng, phân quyền (CUSTOMER, ADMIN) và xác thực (JWT, Refresh Token, Google OAuth2).
3.  **`catalog-service`**: Quản lý danh mục (Category), sản phẩm (Product), biến thể (Product Variant), hình ảnh và các chiến dịch khuyến mãi (Promotions).
4.  **`cart-service`**: Quản lý giỏ hàng của khách hàng và các vật phẩm được thêm vào giỏ.
5.  **`order-service`**: Xử lý tạo đơn hàng, tính toán tổng tiền, và quản lý trạng thái đơn hàng.
6.  **`payment-service`**: Quản lý giao dịch thanh toán thông qua các cổng thanh toán (VNPAY, MOMO, CASH).
7.  **`notification-service`**: Quản lý mẫu nội dung email và lịch sử gửi email thông báo cho khách hàng.
8.  **`recommendation-service`**: Dịch vụ gợi ý sản phẩm liên quan sử dụng thuật toán tính toán Cosine Similarity trên các vector đặc trưng (hỗ trợ bởi extension `pgvector`).

---

## 🏗️ Cấu Trúc Thư Mục Chuẩn Của Mỗi Service

Mỗi microservice tuân theo cấu trúc phân tầng (Layered Architecture) chuẩn dưới đây để đảm bảo tính độc lập và khả năng bảo trì cao:

```text
[service-name]/
├── prisma/
│   ├── schema.prisma       # Định nghĩa database models và kết nối PostgreSQL
│   └── migrations/         # Lưu lịch sử thay đổi database (tạo bởi Prisma)
├── src/
│   ├── config/             # Cấu hình hệ thống (env.ts, database singleton prisma.ts)
│   ├── controllers/        # Tiếp nhận HTTP Request và trả về HTTP Response
│   ├── services/           # Xử lý Logic nghiệp vụ chính (Business Logic) & truy vấn DB
│   ├── routes/             # Khai báo các API Endpoints và liên kết tới Controllers
│   ├── middlewares/        # Express Middlewares (Xác thực, kiểm tra quyền, xử lý lỗi chung)
│   ├── schemas/            # Validation schemas (ví dụ Zod/Joi) validate request body
│   ├── exceptions/         # Định nghĩa các Custom Error Class (ví dụ NotFoundError)
│   ├── types/              # Khai báo các TypeScript Types và Interfaces dùng chung
│   ├── utils/              # Các helper functions tiện ích
│   ├── app.ts              # Khởi tạo Express app, cấu hình middleware toàn cục
│   └── server.ts           # Khởi động Server (app.listen) và kết nối DB
├── tests/                  # Thư mục chứa Unit test / Integration test
├── .env                    # Biến môi trường local (KHÔNG commit lên Git)
├── .env.example            # Bản mẫu cấu hình biến môi trường
├── Dockerfile              # Cấu hình đóng gói container Docker cho service
├── package.json            # Quản lý dependencies & scripts
└── tsconfig.json           # Cấu hình compiler cho TypeScript
```

---

## 🛠️ Hướng Dẫn Thiết Lập (Setup Guide)

Để thiết lập dự án chạy dưới local, vui lòng thực hiện tuần tự theo các bước sau:

### Yêu Cầu Hệ Thống (Prerequisites)
- **Node.js** phiên bản từ `20.x` trở lên.
- **Docker Desktop** (để khởi chạy database PostgreSQL chung).
- Một công cụ quản lý DB (như **pgAdmin 4** hoặc **DBeaver**).

### Bước 1: Khởi Chạy Cơ Sở Dữ Liệu
Hệ thống sử dụng một container PostgreSQL chung chứa 6 database riêng biệt cho các microservices.
1. Di chuyển ra thư mục gốc của dự án (`san-thuong-mai`).
2. Khởi chạy Docker Compose:
   ```bash
   docker compose up -d
   ```
   *Lệnh này sẽ tự động tải phiên bản PostgreSQL tích hợp sẵn `pgvector` và tạo các database thông qua file cấu hình `database/init.sql`.*

### Bước 2: Cấu Hình Biến Môi Trường (.env)
1. Ở mỗi service con, sao chép file `.env.example` thành `.env`.
2. Mở file `.env` và cập nhật chuỗi kết nối cơ sở dữ liệu `DATABASE_URL` theo định dạng:
   ```env
   DATABASE_URL="postgresql://admin:1234567@localhost:5432/<tên_database_service>?schema=public"
   ```
   *(Trong đó, mật khẩu mặc định là `1234567` và tài khoản là `admin` theo cấu hình Docker).*

### Bước 3: Cài Đặt Thư Viện
Với mỗi service mà bạn muốn chạy hoặc phát triển:
1. Di chuyển vào thư mục của service đó (ví dụ `identity-service`):
   ```bash
   cd backend/identity-service
   ```
2. Cài đặt các package:
   ```bash
   npm install
   ```

### Bước 4: Tạo Bảng Trong Database (Migration)
Ở lần đầu tiên thiết lập, bạn cần chạy migration để Prisma đồng bộ hóa các bảng vào PostgreSQL:
1. Chạy lệnh migrate (trong thư mục của service con tương ứng):
   ```bash
   npx prisma migrate dev --name init_schema
   ```
   *Lưu ý riêng cho **`recommendation-service`**: Do có sử dụng extension `pgvector` và chỉ mục HNSW, hãy chắc chắn thực hiện cài đặt extension này trong file `.sql` của migration như mô tả chi tiết ở hướng dẫn riêng của service.*

### Bước 5: Chạy Ứng Dụng Ở Chế Độ Phát Triển (Development)
Chạy lệnh sau tại thư mục của service để khởi động chế độ Hot-reload:
```bash
npm run dev
```

---

## 📝 Lưu Ý Phát Triển

- **Serialization BigInt:** Các bảng sử dụng ID kiểu `BIGSERIAL` (Prisma map thành `BigInt`). Trong JavaScript, kiểu `BigInt` không thể tự động chuyển đổi sang chuỗi JSON khi trả về API. Hãy nhớ chuyển đổi chúng thành dạng `String` hoặc `Number` trong tầng Controller/Service trước khi gửi response về client.
- **Saga Pattern & Idempotency:** Đối với các luồng thanh toán và đặt hàng, hãy chú ý việc kiểm tra tính trùng lặp (Idempotency) dựa trên các trường `gateway_transaction_id` hay `reservation_id`.
