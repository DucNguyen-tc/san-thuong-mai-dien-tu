# Quy tắc Bắt buộc Khi Làm Việc Với Backend (AGENT.md)

Tài liệu này chứa các quy tắc thiết kế, phát triển và quy ước viết mã bắt buộc mà các AI Agent và lập trình viên phải tuân thủ tuyệt đối khi làm việc với phần Backend của dự án **san-thuong-mai**.

---

## 1. Kiến Trúc Hệ Thống & Cấu Trúc Thư Mục

Hệ thống được thiết kế theo kiến trúc **Microservices** và mỗi service tuân thủ cấu trúc phân tầng (**Layered Architecture**).

### Quy định cấu trúc thư mục của một Service:
Mọi Service mới hoặc hiện tại phải tuân theo cấu trúc phân mục chính xác dưới đây:
*   `src/config/`: Nơi lưu trữ cấu hình hệ thống (biến môi trường, database singleton client, v.v.).
*   `src/controllers/`: Tiếp nhận HTTP Request, gọi Services xử lý và trả về HTTP Response. **Tuyệt đối không viết logic nghiệp vụ hay truy vấn DB ở đây.**
*   `src/services/`: Chứa logic nghiệp vụ chính (Business Logic) và thực hiện các câu truy vấn cơ sở dữ liệu thông qua Prisma.
*   `src/routes/`: Khai báo endpoints và ánh xạ chúng tới các hàm tương ứng của Controller.
*   `src/middlewares/`: Express Middlewares (xác thực, kiểm tra quyền, xử lý lỗi tập trung, rate-limiting, v.v.).
*   `src/schemas/`: Định nghĩa schema kiểm định dữ liệu đầu vào (ví dụ: Zod/Joi) để validate Request Body/Query/Params trước khi xử lý.
*   `src/exceptions/`: Định nghĩa các Custom Error Class (ví dụ: `NotFoundError`, `BadRequestError`, `UnauthorizedError`).
*   `src/types/`: Khai báo các TypeScript Types và Interfaces dùng chung.
*   `src/utils/`: Các helper functions tiện ích dùng chung.
*   `prisma/`: Định nghĩa database schema (`schema.prisma`) và lưu trữ các migrations.

---

## 2. Quy Tắc Lập Trình & Viết Code (Coding Conventions)

### 2.1. TypeScript & Type Safety
*   **Không sử dụng `any`:** Bắt buộc định nghĩa Type hoặc Interface rõ ràng cho mọi tham số, biến và kết quả trả về của hàm.
*   Sử dụng chế độ `strict: true` trong cấu hình TypeScript (`tsconfig.json`).
*   Sử dụng async/await thay cho Promise chaining (.then/.catch) để giữ code sạch và dễ đọc.

### 2.2. Quy ước đặt tên (Naming Conventions)
*   **Tên biến/hàm/file:** Sử dụng `camelCase` (ví dụ: `getUserById`, `productController.ts`).
*   **Tên Class/Interface/Type/Enum:** Sử dụng `PascalCase` (ví dụ: `UserService`, `UserInterface`, `Role`).
*   **Thư mục và Package:** Sử dụng `kebab-case` (ví dụ: `identity-service`, `api-gateway`).
*   **Hằng số:** Sử dụng `UPPER_CASE` với dấu gạch dưới (ví dụ: `MAX_RETRY_ATTEMPTS`).
*   **Database (Table & Column):** Sử dụng `snake_case` (ví dụ: `user_addresses`, `password_hash`).

---

## 3. Quy Tắc Cơ Sở Dữ Liệu & Prisma ORM

### 3.1. Database Singleton Client
*   **Bắt buộc** import và sử dụng Prisma Client từ file cấu hình singleton `src/config/prisma.ts` đã tạo sẵn.
*   **Không bao giờ** khởi tạo mới client bằng `new PrismaClient()` ở các file controller hay service khác nhằm tránh quá tải kết nối (Connection Pooling).

### 3.2. Xử lý BigInt (Bắt buộc)
Do các bảng sử dụng kiểu ID tự tăng `BIGSERIAL` (được Prisma ánh xạ thành kiểu `BigInt` trong JavaScript):
*   `BigInt` **không** thể tự động chuyển đổi sang định dạng JSON khi trả về HTTP Response.
*   **Quy tắc bắt buộc:** Lập trình viên phải chuyển đổi các trường kiểu `BigInt` thành `String` (hoặc `Number` nếu đảm bảo không vượt quá giới hạn an toàn `Number.MAX_SAFE_INTEGER`) trước khi trả dữ liệu về Controller/Client.
*   Có thể viết helper function hoặc custom JSON serializer để xử lý tự động.

### 3.3. Database Isolation (Cách ly cơ sở dữ liệu)
*   Mỗi service sở hữu một cơ sở dữ liệu độc lập (ví dụ: `identity_db`, `catalog_db`).
*   **Tuyệt đối không** thực hiện truy vấn trực tiếp từ database của service này sang database của service khác.
*   Mọi tương tác giữa các service phải đi qua **API Gateway** hoặc thông qua cơ chế giao tiếp liên dịch vụ (gọi HTTP API hoặc Event Broker nếu có).

### 3.4. Migrations & Schema Changes
*   Không chỉnh sửa trực tiếp cấu trúc DB bằng các công cụ như pgAdmin/DBeaver. Mọi thay đổi cấu trúc bảng phải được thực hiện thông qua file `prisma/schema.prisma` và chạy lệnh:
    ```bash
    npx prisma migrate dev --name <migration_name>
    ```
*   *Lưu ý riêng cho `recommendation-service`:* Do có sử dụng extension `pgvector` (`Unsupported("vector(500)")`), khi tạo migration mới phải đảm bảo có câu lệnh cài đặt extension `CREATE EXTENSION IF NOT EXISTS vector;` trong file SQL trước khi tạo bảng.

---

## 4. Xử Lý Lỗi & Validation

### 4.1. Validation dữ liệu đầu vào (Input Validation)
*   Mọi API nhận dữ liệu từ client (`req.body`, `req.query`, `req.params`) phải được validate bằng schema (ví dụ: Zod) tại tầng middleware hoặc router trước khi đi vào controller.

### 4.2. Quản lý Lỗi Tập Trung (Global Error Handling)
*   Tất cả lỗi phát sinh trong hệ thống phải được chuyển tiếp đến Middleware xử lý lỗi tập trung (`errorHandler` middleware).
*   Sử dụng các Custom Error Class kế thừa từ một lớp lỗi cơ bản (ví dụ: `AppError` hoặc `HttpException`) chứa `statusCode` và `message` thân thiện với người dùng.
*   **Bảo mật:** Không bao giờ trả về lỗi thô từ database (Prisma error) hoặc Stack Trace cho client ở môi trường Production. Chỉ hiển thị thông báo lỗi chung chung (ví dụ: `"Internal Server Error"`) và log chi tiết lỗi ra console hoặc hệ thống monitor ở phía server.

---

## 5. Quản Lý Biến Môi Trường (.env)

*   **Không bao giờ** commit các file `.env` chứa thông tin nhạy cảm lên Git repository.
*   Mọi biến môi trường mới cần thiết cho ứng dụng phải được khai báo cấu hình mẫu trong file `.env.example`.
*   Khi thiết lập ở môi trường local hoặc deploy, thực hiện copy `.env.example` sang `.env` và điền giá trị thích hợp.
*   Cần kiểm tra sự tồn tại của các biến môi trường quan trọng ngay khi khởi chạy server trong `src/config/` để phát hiện sớm lỗi thiếu cấu hình.

---

## 6. Giao Dịch & Tính Trùng Lặp (Transactions & Idempotency)

*   **Idempotency (Tính trùng lặp):** Đối với các tác vụ liên quan đến tài chính, thanh toán (`payment-service`) hoặc tạo đơn hàng (`order-service`), bắt buộc phải kiểm tra trùng lặp thông qua các khóa duy nhất (như `gateway_transaction_id`, `reservation_id`, hoặc `idempotency_key`) trước khi xử lý giao dịch.
*   **Database Transactions:** Sử dụng `prisma.$transaction([...])` khi cần thực hiện nhiều câu lệnh ghi (Create/Update/Delete) đồng thời mà cần đảm bảo tính toàn vẹn dữ liệu (hoặc cùng thành công hoặc cùng thất bại).

---

## 7. Quy Trình Kiểm Thử (Testing)

*   Mỗi service nên có thư mục `tests` chứa unit tests và integration tests.
*   Trước khi tạo Pull Request, hãy đảm bảo tất cả các test suite của service đang phát triển đều vượt qua (`npm run test` nếu có).
