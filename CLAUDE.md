# Project Context: San Thuong Mai Dien Tu (E-Commerce Platform)

## 🛑 AI Agent Rules (Lệnh Bắt Buộc)
1. **Bảo vệ Database:** Tuyệt đối **KHÔNG ĐƯỢC** chạy các lệnh thay đổi dữ liệu hoặc schema database (như migration, seed, update table) khi chưa hỏi ý kiến và được sự đồng ý của User.
2. **Giải thích & Đợi duyệt:** Trước khi thực thi bất kỳ câu lệnh (command) nào hoặc chỉnh sửa lớn, AI **PHẢI** giải thích rõ hướng đi sắp làm và ĐỢI user duyệt.
3. **Context:** User đang tương tác là **Người B** (phụ trách Catalog & AI Recommendation).
4. **Hướng dẫn Test (Nghiệm thu):** Mỗi khi hoàn thành xong một task hoặc tính năng, AI **PHẢI** cung cấp hướng dẫn chi tiết cách test nghiệm thu trên Frontend (nếu có UI) để User dễ dàng kiểm tra.
5. **Quản lý Git (Branching):** Khi bắt đầu làm các task của một Tuần mới, luôn phải tạo nhánh mới tương ứng (Ví dụ: `feature/tuan3-catalog-recommendation`) để commit code, tránh commit nhầm vào nhánh của tuần cũ.
6. **Nạp Seed Data (Dữ liệu mẫu):** Phải luôn tự động chạy lệnh nạp seed data (vd: `npx prisma db seed`) vào các service liên quan để có sẵn dữ liệu trước khi báo User vào test giao diện.

## Architecture
Microservices architecture using Node.js/Express for backend services and React/Vite for the frontend.

## Tech Stack
**Frontend:**
- React 19, TypeScript, Vite
- Tailwind CSS v4 for styling
- Zustand for state management
- React Router DOM for routing
- React Hook Form + Zod for form validation
- Axios for API requests

**Backend Services (e.g., identity-service, catalog-service, etc.):**
- Node.js, Express, TypeScript
- Prisma ORM
- PostgreSQL (with pgvector extension)
- RabbitMQ for inter-service communication (AMQP)
- Zod for data validation

**Infrastructure:**
- Docker Compose for Database (Postgres) and Message Broker (RabbitMQ)
- `concurrently` to run all services at once during development

## Services Directory
- `frontend/`
- `backend/api-gateway/`
- `backend/identity-service/`
- `backend/catalog-service/`
- `backend/cart-service/`
- `backend/order-service/`
- `backend/payment-service/`
- `backend/notification-service/`
- `backend/recommendation-service/`
- `ai/` (AI related service/scripts)

## Common Commands
- **Start all services (Frontend + All Backend Services):** `npm start` (from the root directory)
- **Start specific service:** `npm run start:[service-name]` (e.g., `npm run start:frontend`, `npm run start:identity`)
- **Start Docker Containers:** `docker-compose up -d` (to start Postgres and RabbitMQ)

## Database & Broker
- **Postgres:** Port `5432` (User: admin, DB: postgres)
- **RabbitMQ:** Port `5672` for AMQP, `15672` for Management UI

## Team & Roles (Kế Hoạch Phân Công)
**Nhóm 3 người — Thời gian: 5 tuần**
- **Kiến trúc:** SOA/Microservices, Database-per-Service, Saga Orchestration.
- **Nguyên tắc:** Chia theo cụm service (không chia tầng frontend/backend). Mỗi người sở hữu trọn vẹn Backend + Frontend + Database schema của cụm service phụ trách, tự publish/consume event RabbitMQ để hạn chế xung đột merge.
- **Linh động (Lưu ý quan trọng):** AE nhớ linh động phần việc của mình. Phân công công việc có thể sẽ hơi thiếu sót vài phần, nếu thấy thiếu hoặc cần thiết thì chủ động bổ sung/hỗ trợ nhau nhé.

**👉 LƯU Ý: Người dùng hiện tại là NGƯỜI B. (Đã hoàn thành xong các task của Tuần 2)**

| Người | Backend sở hữu (Schema riêng) | Frontend sở hữu | Lý do nhóm chung |
|---|---|---|---|
| **A** | Identity, Notification | Auth, Layout Admin, Dashboard | Nền tảng hệ thống, ít rủi ro conflict. |
| **B (Bạn)** | Catalog, Recommendation | Danh sách/chi tiết SP, SP tương tự, Admin QL Sản phẩm | Recommendation tiêu thụ trực tiếp dữ liệu từ Catalog (TF-IDF). |
| **C** | Cart, Order (Saga), Payment | Giỏ hàng, Checkout, Admin QL Đơn hàng | Luồng Saga chính, gom 1 người điều phối xử lý giao dịch. |

## 🧠 Chi tiết Phân hệ AI (Recommendation Service)
- **Thuật toán cốt lõi:** Content-Based Filtering, sử dụng **TF-IDF** (chuyển đổi text thành vector) và **Cosine Similarity** (đo khoảng cách/độ tương đồng).
- **Kiến trúc độc lập:** Có schema riêng (`recommendation`), không query trực tiếp dữ liệu từ Catalog để đảm bảo Autonomy.
- **Trigger Bất đồng bộ (RabbitMQ):** Bắt event `product.created` và `product.updated` để tự động tính lại vector dưới nền (background task) → Không làm chậm trải nghiệm của Admin. Lưu kết quả vào bảng `product_vectors` (cột embedding).
- **Phục vụ truy vấn (Serving):** Khi gọi `GET /api/recommendations/:id`, tận dụng extension **pgvector** của PostgreSQL để tính khoảng cách ngay tại tầng DB, tăng tốc độ truy vấn.
- **Vòng lặp phản hồi (Feedback Loop):** Lưu vết hành vi user vào `recommendation_logs` (IMPRESSION, CLICK, PURCHASE) kèm `similarity_score` để đo tỷ lệ chuyển đổi (CR) và cải tiến sau này.

## Roadmap (Lộ trình 5 tuần)
- **Tuần 1:** Setup hạ tầng, convention, dựng entity + migration, scaffold auth.
- **Tuần 2:** CRUD cốt lõi từng service, Frontend nối API. *(Bạn đã hoàn thành)*
- **Tuần 3:** Logic nghiệp vụ phức tạp (TF-IDF, Saga, RabbitMQ events).
- **Tuần 4:** Tích hợp chéo hệ thống (VNPay/MoMo sandbox, Dashboard, xử lý lỗi bù trừ).
- **Tuần 5:** Test E2E, sửa bug, seed dữ liệu demo.

## Chi tiết công việc từng tuần (Task Breakdown)

### Tuần 1 — Dựng nền hệ thống
- **Người A:** Migration Identity. Auth API cơ bản. Frontend Login/Register & Layout Admin.
- **Người B:** Migration Catalog/Recommendation. API CRUD SP. Frontend UI SP & Admin SP.
- **Người C:** Migration Cart/Order/Payment. Khung API rỗng. Frontend Giỏ hàng/Checkout tĩnh.

### Tuần 2 — CRUD cốt lõi *(Hoàn thành)*
- **Người A:** CRUD User/Address. Đổi mật khẩu. Admin user API. Notification template email.
- **Người B (Bạn):** CRUD Product (kèm biến thể/tồn kho), Category. Upload Cloudinary. API Search (pg_trgm). CRUD Coupon. UI Search/Admin Product/Admin Coupon.
- **Người C:** CRUD Cart. Order API (khởi tạo PENDING). Frontend UI Giỏ hàng/Checkout thật.

### Tuần 3 — Logic nghiệp vụ phức tạp *(Đang làm)*
- **Người A:** Refresh token, RBAC Middleware. Consumer gửi email đơn hàng. UI refresh token/phân quyền Admin.
- **Người B (Bạn):**
  - **Backend:** Module tính TF-IDF từ mô tả SP, sinh vector lưu vào `product_vectors`.
  - **Backend:** Consumer RabbitMQ lắng nghe `product.created`/`product.updated` để tính lại vector.
  - **Backend:** API GET `/api/recommendations/:id` tính Cosine Similarity trả top SP tương đồng.
  - **Frontend:** Hiển thị khối "Sản phẩm tương tự" / "Có thể bạn sẽ thích" trên trang chi tiết SP và trang chủ.
- **Người C:** Saga Orchestration (Reserve-stock → Payment). Callback thanh toán. Compensating transaction (release-stock). UI Checkout (redirect VNPay/MoMo).

### Tuần 4 — Tích hợp chéo
- **Người A:** API Dashboard. Ghi nhận `recommendation_logs`. Hoàn thiện bảo mật. UI Dashboard tổng.
- **Người B (Bạn):**
  - **Backend:** Tối ưu tìm kiếm. Cân nhắc pgvector cho tốc độ.
  - **Backend:** API thống kê hiệu quả AI cho Admin.
  - **Frontend:** Trang thống kê AI Admin. Polish UI trang SP/Search.
- **Người C:** Tích hợp VNPay/MoMo IPN thật. Xử lý đầy đủ luồng lỗi/hủy đơn. API trạng thái Order. UI "Đơn hàng của tôi".

### Tuần 5 — Kiểm thử, hoàn thiện, báo cáo
- Ưu tiên test E2E xuyên suốt cả 3 cụm service.
- **Người B (Bạn):** Test luồng AI: Sửa sản phẩm → Vector cập nhật → Gợi ý chuẩn. Seed dữ liệu phong phú để demo. Tối ưu hiệu năng truy vấn nếu dữ liệu lớn.

---

## 🎯 Tiến độ công việc của Người B (Checklist)
*Đánh dấu `[x]` vào các task đã hoàn thành để theo dõi tiến độ.*

### Tuần 1: Dựng nền hệ thống (✅ Đã xong)
- [x] **Backend:** Migration schema catalog & recommendation.
- [x] **Backend:** API CRUD SP cơ bản.
- [x] **Frontend:** Khung trang danh sách, chi tiết SP.
- [x] **Frontend:** Khung trang Admin quản lý SP.

### Tuần 2: CRUD cốt lõi (✅ Đã xong)
- [x] **Backend:** Hoàn thiện CRUD product (biến thể, tồn kho), category cha-con.
- [x] **Backend:** Upload ảnh Cloudinary.
- [x] **Backend:** API tìm kiếm SP theo tên/từ khóa (pg_trgm).
- [x] **Backend:** Schema Coupon + API Admin CRUD khuyến mãi.
- [x] **Frontend:** Trang tìm kiếm SP, filter danh mục.
- [x] **Frontend:** Trang Admin CRUD SP/Category kèm upload ảnh.
- [x] **Frontend:** Trang Admin quản lý khuyến mãi.

### Tuần 3: Logic nghiệp vụ AI (✅ Đã xong)
- [x] **Backend:** Module tính TF-IDF từ mô tả SP, sinh vector và lưu vào `product_vectors`.
- [x] **Backend:** RabbitMQ consumer lắng nghe `product.created`/`product.updated` tự động tính lại vector.
- [x] **Backend:** API GET `/api/recommendations/:id` tính Cosine Similarity, trả top-N SP tương đồng.
- [x] **Frontend:** Hiển thị khối "Sản phẩm tương tự" / "Có thể bạn sẽ thích" trên trang chi tiết SP và trang chủ.

### Tuần 4: Tích hợp chéo (📅 Sắp tới)
- [ ] **Backend:** Tối ưu tìm kiếm (cân nhắc pgvector).
- [ ] **Backend:** API thống kê hiệu quả gợi ý AI (tỷ lệ chuyển đổi).
- [ ] **Frontend:** Trang thống kê hiệu quả AI cho Admin.
- [ ] **Frontend:** Polish UI trang sản phẩm, trang tìm kiếm.

### Tuần 5: Kiểm thử & Hoàn thiện (📅 Sắp tới)
- [ ] **Test:** Kiểm tra luồng AI (tạo/sửa SP → vector tính lại qua RabbitMQ → gợi ý đúng).
- [ ] **Data:** Seed dữ liệu sản phẩm phong phú để demo gợi ý có ý nghĩa.
- [ ] **Tối ưu:** Tối ưu hiệu năng truy vấn Cosine Similarity nếu dữ liệu lớn.
