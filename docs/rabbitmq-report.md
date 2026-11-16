# Báo Cáo: Ứng Dụng RabbitMQ Trong Hệ Thống Sàn Thương Mại Điện Tử

> **Dự án:** Sàn Thương Mại Điện Tử (San Thuong Mai Dien Tu)  
> **Kiến trúc:** Microservices – SOA (Service-Oriented Architecture)  
> **Tác giả:** Nhóm 3 người – Người B (Phụ trách Catalog & AI Recommendation)

---

## 1. Tổng Quan về RabbitMQ

### 1.1. RabbitMQ là gì?

RabbitMQ là một **Message Broker** (trung gian truyền thông điệp) mã nguồn mở, được xây dựng trên giao thức **AMQP (Advanced Message Queuing Protocol)**. Nó đóng vai trò trung gian tiếp nhận, lưu trữ tạm thời và phân phối các thông điệp (Messages) giữa các ứng dụng hoặc service với nhau một cách **bất đồng bộ (Asynchronous)**.

Trong kiến trúc **Microservices**, mỗi service sở hữu cơ sở dữ liệu riêng (nguyên tắc **Database-per-Service**). RabbitMQ trở thành "đường dây liên lạc" chính thức, giúp các service trao đổi thông tin thông qua các sự kiện (Events) mà không cần phải kết nối trực tiếp vào database của nhau.

### 1.2. Các khái niệm cốt lõi áp dụng trong dự án

*   **Publisher:** Service gửi sự kiện ra ngoài (VD: Catalog Service).
*   **Consumer:** Service nhận và xử lý sự kiện (VD: Notification Service, Recommendation Service).
*   **Exchange (Bộ định tuyến):** Nhận message từ Publisher và phân bổ vào các Queue dựa trên quy tắc (Binding). Hệ thống sử dụng loại `topic` để định tuyến linh hoạt.
*   **Queue (Hàng đợi):** Nơi lưu trữ message chờ Consumer lấy ra xử lý.
*   **Routing Key:** "Nhãn dán" phân loại sự kiện (VD: `product.created`, `order.completed`).
*   **ACK / NACK:** Tín hiệu Consumer báo lại cho RabbitMQ biết đã xử lý thành công (để xóa message) hoặc thất bại.

### 1.3. Lợi ích khi sử dụng RabbitMQ

1.  **Tách biệt các Service (Loose Coupling):** Các service giao tiếp độc lập. Nếu sau này cần thêm tính năng mới (như thống kê, phân tích dữ liệu), chỉ cần tạo Queue mới để nghe sự kiện cũ mà không phải sửa code gốc.
2.  **Đảm bảo độ tin cậy (Reliability):** Sử dụng cờ `durable` (lưu trạng thái) và `persistent` (lưu ổ cứng), đảm bảo không mất dữ liệu ngay cả khi hệ thống khởi động lại.
3.  **Xử lý bất đồng bộ (Async Processing):** Đẩy các tác vụ nặng (tính toán AI, gửi Email) vào nền, giúp phản hồi API cho người dùng nhanh chóng.
4.  **Điều phối Saga Pattern:** Quản lý giao dịch phân tán qua nhiều service (Giữ kho -> Thanh toán -> Nhả kho nếu lỗi).

---

## 2. Cấu Trúc Hạ Tầng RabbitMQ

Hệ thống được khởi chạy qua **Docker Compose** chung với PostgreSQL. RabbitMQ cung cấp giao diện quản lý (Management UI) tại port `15672` và giao tiếp AMQP tại port `5672`.

Toàn bộ hệ thống sử dụng **2 Exchange chính** (loại `topic`):

1.  **`product.events`**: Quản lý vòng đời sản phẩm.
    *   Queue `recommendation.product.sync`: Lắng nghe `product.created`, `product.updated`.
2.  **`order_events`**: Quản lý vòng đời đơn hàng.
    *   Các Queue con như `notification_order_completed`, `notification_order_cancelled` lắng nghe trạng thái đơn hàng để gửi thông báo.

---

## 3. Chi Tiết Triển Khai Tại Các Service

### 3.1. Catalog Service (Quản lý Sản phẩm)

*   **Vai trò:** Vừa là **Publisher** (Phát sự kiện), vừa là **Consumer** (Nhận lệnh từ Saga).
*   **Nhiệm vụ Publisher:** Bất cứ khi nào Admin thêm mới hoặc chỉnh sửa sản phẩm, Catalog Service sẽ phát sự kiện `product.created` hoặc `product.updated` lên Exchange `product.events`. Hệ thống cũng có một script chạy batch để đẩy toàn bộ sản phẩm cũ lên RabbitMQ trong lần đầu deploy.
*   **Nhiệm vụ Consumer:** Phục vụ luồng đặt hàng. Nó phơi bày API hoặc lắng nghe lệnh để thực hiện **Giữ tồn kho (Reserve Stock)** tạm thời và **Nhả tồn kho (Release Stock)** khi có sự cố hủy đơn.

### 3.2. Recommendation Service (Gợi ý Sản phẩm AI)

*   **Vai trò:** **Consumer**.
*   **Nhiệm vụ:** Lắng nghe Queue `recommendation.product.sync`.
*   **Luồng xử lý:** Khi nhận được sự kiện cập nhật sản phẩm từ Catalog, nó trích xuất Tên, Mô tả, Danh mục và tiến hành:
    1.  Loại bỏ Stop words, chuẩn hóa chuỗi.
    2.  Áp dụng **Hashing Trick** để tạo Vector 384 chiều (Tính tần suất từ vựng - TF). Tên sản phẩm được cấp trọng số cao nhất.
    3.  L2 Normalization (Chuẩn hóa vector) để phù hợp cho việc tính Cosine Similarity.
    4.  Lưu (Upsert) Vector này vào bảng `product_vectors` của PostgreSQL (nhờ extension `pgvector`).
*   **Điểm nhấn:** Nhờ RabbitMQ, quá trình tính toán phức tạp này chạy ngầm hoàn toàn.

### 3.3. Order Service (Saga Orchestrator - Điều phối viên)

*   **Vai trò:** **Publisher** và **Người điều phối**.
*   **Nhiệm vụ:** Chịu trách nhiệm phát đi các sự kiện để thông báo trạng thái đơn hàng (Sử dụng Singleton Pattern cho kết nối RabbitMQ).
*   **Các sự kiện phát ra:**
    *   `order.completed`: Đơn hàng xác nhận.
    *   `order.shipping`: Đơn hàng đang vận chuyển.
    *   `order.delivered`: Giao thành công.
    *   `order.cancelled`: Đơn hàng bị hủy.
*   **Luồng điều phối (Saga):**
    1.  Gọi API sang Catalog Service yêu cầu Giữ Tồn Kho.
    2.  Gọi API sang Payment Service tạo thanh toán.
    3.  Nhận phản hồi thanh toán. Nếu thành công -> Chốt kho, Đổi trạng thái, Phát `order.completed`. Nếu thất bại -> Nhả kho, Đổi trạng thái, Phát `order.cancelled`.

### 3.4. Payment Service (Xử lý Thanh toán)

*   **Vai trò:** Cầu nối trung gian.
*   **Nhiệm vụ:** Sau khi khách hàng thanh toán tại VNPay/MoMo, cổng thanh toán sẽ gọi IPN Webhook về Payment Service. Service này xác thực chữ ký điện tử chống giả mạo, lưu trạng thái giao dịch và phản hồi kết quả để Order Service quyết định các bước tiếp theo trong Saga.

### 3.5. Notification Service (Thông báo)

*   **Vai trò:** **Consumer**.
*   **Nhiệm vụ:** Liên tục lắng nghe 4 Queue tương ứng với 4 trạng thái của đơn hàng (`completed`, `shipping`, `delivered`, `cancelled`).
*   **Luồng xử lý (Template Method):**
    1.  Tạo bản ghi log với trạng thái `PENDING` vào Database.
    2.  Load template HTML tương ứng (từ Database hoặc mẫu dự phòng), điền mã đơn, tên khách, số tiền.
    3.  Gửi Email qua SMTP (Nodemailer).
    4.  Cập nhật trạng thái log thành `SENT` và gửi lệnh ACK cho RabbitMQ. Nếu lỗi, đánh dấu `FAILED` và gửi NACK.

---

## 4. Luồng Sự Kiện End-to-End

### 4.1. Luồng Cập nhật AI (Background Job)

```
Admin sửa Sản phẩm
       │
       ▼
[Catalog Service] ─── (Phát: product.updated) ───► [RabbitMQ]
                                                      │
                                                      ▼
[Recommendation Service] ◄─── (Lấy Message từ Queue) ─┘
       │
       └──► Tính Vector TF-IDF 384 chiều
       └──► Lưu vào pgvector Database
       └──► Gửi ACK hoàn tất
```

### 4.2. Luồng Saga Đặt Hàng (Happy Path)

```
Khách nhấn Đặt Hàng
       │
       ▼
[Order Service] ───────(Yêu cầu Giữ Kho)───────► [Catalog Service] (Thành công)
       │
       ├──────────(Tạo & Trả URL Thanh toán)─────► [Payment Service]
       │                                                 │
(Chờ IPN Callback)                                (Khách thanh toán xong)
       │                                                 │
       ◄──────────(Báo kết quả thành công)───────────────┘
       │
       └──► Chốt đơn (CONFIRMED), Chốt Kho
       └──► Phát sự kiện "order.completed" lên RabbitMQ
                                  │
                                  ▼
[Notification Service] ◄──────────┘
       │
       └──► Gửi Email Xác Nhận Đơn Hàng
```

### 4.3. Luồng Bù Trừ - Hủy Đơn (Compensating Transaction)

```
(Khách Hủy Thanh Toán / Hết Hạn)
       │
       ▼
[Payment Service] ──────(Báo kết quả thất bại)───► [Order Service]
                                                         │
                                                         ▼
[Catalog Service] ◄──(Lệnh Bù Trừ: NHẢ LẠI KHO)──────────┤
                                                         │
                                                         └──► Hủy đơn (CANCELLED)
                                                         └──► Phát "order.cancelled"
                                                                       │
                                                                       ▼
[Notification Service] ◄───────────────────────────────────────────────┘
       │
       └──► Gửi Email Thông Báo Hủy Đơn
```

---

## 5. Các Cơ Chế Đảm Bảo Tính An Toàn (Reliability)

1.  **Cơ chế ACK/NACK (Acknowledge):** Message không tự động bị xóa khi lấy ra khỏi Queue. Nó chỉ bị xóa (ACK) khi Notification hoặc Recommendation báo cáo đã xử lý thành công. Nếu có lỗi (NACK), message bị loại bỏ (hoặc đẩy vào vùng chứa lỗi DLX).
2.  **Auto-Retry:** Môi trường Docker đôi khi khiến RabbitMQ khởi động chậm hơn các Service. Tất cả Service đều có cơ chế tự động thử kết nối lại sau mỗi 5 giây, chống lỗi sập ứng dụng.
3.  **Durable & Persistent:** Khai báo Queue có đặc tính `durable: true` (sống sót qua khởi động lại) và message có đặc tính `persistent: true` (lưu xuống đĩa cứng). Điều này chống thất thoát dữ liệu tuyệt đối.

---

*Tài liệu tóm tắt kiến trúc và luồng dữ liệu RabbitMQ của hệ thống.*
