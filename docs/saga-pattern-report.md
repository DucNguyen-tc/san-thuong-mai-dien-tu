# Báo Cáo Cài Đặt Chi Tiết: Mẫu Thiết Kế Saga Pattern (Saga Orchestration)

> **Dự án:** Sàn Thương Mại Điện Tử (San Thuong Mai Dien Tu)  
> **Kiến trúc:** Microservices (SOA)  
> **Domain áp dụng chính:** Quy trình Đặt hàng, Trừ Tồn Kho và Xử lý Thanh toán (Order & Checkout Workflow)

---

## 1. Đặt Vấn Đề Và Cơ Sở Lựa Chọn Kiến Trúc

### 1.1. Bài toán toàn vẹn dữ liệu trong Microservices
Trong hệ thống nguyên khối (Monolithic), toàn bộ dữ liệu Đơn hàng (Orders), Sản phẩm (Products), và Giao dịch (Payments) nằm chung trên một Database (thường là RDBMS như MySQL/PostgreSQL). Khi khách hàng đặt mua sản phẩm, ta chỉ cần mở một Database Transaction (sử dụng lệnh `BEGIN TRANSACTION`). Sau khi thực hiện tuần tự các bước: Trừ tồn kho, Tạo hóa đơn, Lưu lịch sử, nếu có lỗi ở bất kỳ khâu nào (ví dụ: mất mạng, hết hàng), hệ thống chỉ cần gọi lệnh `ROLLBACK` để mọi thao tác tự động được hủy bỏ, đảm bảo tính nguyên vẹn của dữ liệu (ACID).

Tuy nhiên, với kiến trúc **Microservices** của dự án, hệ thống tuân thủ nguyên tắc **Database-per-Service** nhằm đảm bảo sự phân tách độc lập (Loose Coupling):
- **Order Service:** Sở hữu Database chứa bảng `Orders`, `OrderItems`.
- **Catalog Service:** Sở hữu Database chứa bảng `Products`, `ProductVariants` (quản lý số lượng tồn kho).
- **Payment Service:** Sở hữu Database chứa bảng `Payments`, `Transactions`.

Do mỗi Service quản lý một Database riêng biệt, ta không thể sử dụng một `Transaction` chung. Sẽ ra sao nếu Catalog Service đã trừ tồn kho thành công, nhưng Payment Service lại thông báo thẻ khách hàng không đủ tiền? Làm thế nào để hoàn trả lại số lượng tồn kho đó mà không gây sai lệch dữ liệu?

### 1.2. Giải pháp: Saga Pattern
Để giải quyết bài toán trên, dự án áp dụng **Saga Pattern**. Saga là một chuỗi các giao dịch cục bộ (Local Transactions). Mỗi khi một Local Transaction chạy xong, nó sẽ kích hoạt Local Transaction tiếp theo trong chuỗi. 

Saga chia làm 2 mô hình chính:
- **Choreography (Biên đạo):** Các service giao tiếp chéo với nhau qua event. (Thường rắc rối, khó tracking luồng đi của đơn hàng).
- **Orchestration (Điều phối):** Có một Service đóng vai trò là "Nhạc trưởng" điều khiển toàn bộ luồng. (Dự án chọn mô hình này).

👉 **Lựa chọn của dự án:** Lựa chọn **Saga Orchestration**, chỉ định **Order Service làm Nhạc Trưởng (Orchestrator)**. Order Service sẽ biết rõ quá trình mua hàng gồm bao nhiêu bước, gọi service nào, và nếu lỗi thì phải xử lý ra sao.

---

## 2. Các Thành Phần Và Ma Trận Giao Dịch

### 2.1. Các thành phần tham gia (Participants)

1. **Order Service (Orchestrator):** Trung tâm điều phối, nắm giữ State Machine (Trạng thái đơn hàng: `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`).
2. **Catalog Service:** Chịu trách nhiệm thực thi các lệnh liên quan đến Tồn kho (Reserve - Giữ kho, Commit - Chốt kho, Release - Nhả kho).
3. **Payment Service:** Liên kết cổng thanh toán bên thứ ba (VNPay, MoMo), nhận IPN Callback và báo lại kết quả.
4. **Notification Service:** Consumer đứng cuối chuỗi Saga, phát email cho khách hàng qua RabbitMQ dựa trên kết quả cuối cùng.

### 2.2. Ma Trận Giao Dịch Bù Trừ (Compensating Transactions)

Đặc trưng cốt lõi của Saga là: Mỗi bước tiến tới (Forward) thay đổi dữ liệu đều phải đi kèm với một bước lùi (Compensating) để hoàn tác nếu có sự cố xảy ra ở các bước sau.

| Bước | Service Thực Thi | Giao dịch chính (Tiến - Forward) | Giao dịch Bù trừ (Lùi - Compensating) |
|:---:|---|---|---|
| **1** | **Order** | Tạo đơn hàng mới, lưu trạng thái khởi tạo là `PENDING_PAYMENT` | Cập nhật trạng thái đơn hàng thành `CANCELLED` |
| **2** | **Catalog** | Giữ tồn kho tạm thời (`Reserve Stock`) | Nhả lại tồn kho (`Release Stock`) |
| **3** | **Payment**| Khởi tạo Session thanh toán, sinh URL | Hủy bỏ session, cập nhật giao dịch thành `FAILED` |

---

## 3. Cài Đặt Chi Tiết Luồng Đặt Hàng (Saga Execution Flow)

Dưới đây là mô tả chi tiết từng bước (Step-by-step) của chuỗi điều phối Saga được lập trình bên trong Order Service.

### Bước 1: Khởi tạo Đơn hàng (Local Transaction)
Khi nhận được request đặt hàng từ Frontend, **Order Service** bắt đầu quy trình bằng cách lưu thông tin giỏ hàng và địa chỉ vào cơ sở dữ liệu nội bộ của nó. Đơn hàng được gắn trạng thái `PENDING_PAYMENT`.

### Bước 2: Kích hoạt Giữ Tồn Kho (Reserve Stock)
Thay vì trừ thẳng vào tổng số lượng kho (`stock_quantity`), Order Service gọi REST API nội bộ sang **Catalog Service** yêu cầu "Giữ kho".
*   **Xử lý tại Catalog:** Catalog Service dùng Database Transaction kết hợp Row-level Locking để kiểm tra xem `(stock_quantity - stock_reserved) >= số_lượng_mua` hay không. Nếu đủ, nó tăng cột `stock_reserved` lên. 
*   **Nếu Thất bại (Hết hàng):** Catalog Service trả về mã lỗi 400. Order Service bắt được lỗi này, lập tức chạy bù trừ cho Bước 1: Gọi hàm Update đổi trạng thái Order thành `CANCELLED`. Chuỗi Saga kết thúc an toàn, báo cho khách hàng là "Hết hàng".
*   **Nếu Thành công:** Catalog trả về 200 OK. Saga tiếp tục.

### Bước 3: Khởi tạo Thanh toán
Order Service tiếp tục gọi API sang **Payment Service** để sinh URL thanh toán (ví dụ VNPay).
*   **Nếu Thất bại (Cổng thanh toán bị sập/Lỗi kết nối):** Order Service nhận biết sự cố không thể thu tiền. Nó phải rollback lại Bước 2. Nó gửi request `Release Stock` sang Catalog Service để giảm cột `stock_reserved` xuống (hoàn hàng lên kệ). Cuối cùng, cập nhật Order thành `CANCELLED`.
*   **Nếu Thành công:** Order Service trả về URL VNPay cho Frontend. Khách hàng được chuyển hướng sang trang quẹt thẻ. Đơn hàng nằm im ở trạng thái chờ đợi.

### Bước 4: Xử lý Bất đồng bộ từ IPN (Webhook)
Quá trình thanh toán có thể tốn vài phút. Cổng VNPay sau khi thu tiền sẽ gọi IPN Webhook về Payment Service ở chế độ background. Payment Service tiếp tục báo kết quả cho Order Service để chốt hạ Saga.

*   **Kịch bản A (Khách hàng Thanh toán Thành công):** 
    1. Payment Service cập nhật bản ghi thành `SUCCESS`.
    2. Order Service đổi trạng thái đơn thành `CONFIRMED`.
    3. Order Service gọi Catalog Service thực hiện **`Commit Stock`**: Đây là lúc Catalog Service trừ vĩnh viễn cả 2 cột `stock_quantity` và `stock_reserved`, biến "hàng tạm giữ" thành "hàng đã xuất".
    4. Order Service phát sự kiện `order.completed` lên hệ thống Message Queue (RabbitMQ).
    5. Notification Service bắt sự kiện và gửi Email Xác nhận. (Kết thúc chuỗi).

*   **Kịch bản B (Khách hàng Hủy thẻ / Thẻ hết tiền):**
    1. Payment Service nhận IPN báo lỗi, cập nhật giao dịch `FAILED`.
    2. Order Service nhận tín hiệu thất bại, đổi trạng thái đơn thành `CANCELLED`.
    3. Order Service kích hoạt Compensating Transaction: Gọi Catalog Service thực hiện **`Release Stock`** (Nhả lại kho, đưa số lượng khả dụng về như cũ). (Kết thúc chuỗi).

---

## 4. Xử Lý Các Edge Cases (Các Góc Khuất Rủi Ro)

Việc áp dụng hệ thống phân tán đòi hỏi team phải tính đến các tình huống rủi ro (Edge Cases) như Timeout hoặc Network Partition (đứt mạng).

### 4.1. Xử lý Timeout (Khách hàng "Bùng" đơn)
**Tình huống:** Ở Bước 3, khách hàng được chuyển sang trang VNPay, nhưng họ quyết định tắt trình duyệt và đi ngủ. IPN của VNPay sẽ không bao giờ được gọi về. Dữ liệu bị treo: Đơn hàng mãi ở trạng thái `PENDING`, và số lượng hàng hóa bên Catalog Service bị "Giữ (Reserve)" vĩnh viễn, người khác không thể mua được (Dẫn đến mất doanh thu).

**Giải pháp cài đặt:** 
Order Service tích hợp một **Background Cronjob** (Worker chạy ngầm).
*   Định kỳ mỗi 5 phút, Cronjob quét toàn bộ bảng Orders.
*   Nếu phát hiện đơn hàng nào có trạng thái `PENDING_PAYMENT` và thời gian tạo đã vượt quá thời gian cho phép (ví dụ: 30 phút).
*   Cronjob sẽ đóng vai trò như một tác nhân Hủy đơn, tự động kích hoạt **Compensating Transaction**:
    1. Gọi Payment Service để ép trạng thái thanh toán thành `TIMEOUT / CANCELLED`.
    2. Gọi Catalog Service thực hiện lệnh **`Release Stock`** (Giải phóng toàn bộ tồn kho đang bị giam lỏng).
    3. Đánh dấu đơn hàng thành `CANCELLED`.

### 4.2. Tính Idempotency (Chống lặp) của API Bù Trừ
**Tình huống:** Quá trình mạng chập chờn. Khi Order Service gọi API `Release Stock` để hoàn kho, tín hiệu đã đến được Catalog Service và kho đã được nhả. Tuy nhiên, trên đường phản hồi (Response 200 OK) về Order Service thì rớt mạng. Order Service lầm tưởng lệnh nhả kho chưa tới nơi, nó tiến hành gọi lại (Retry) lệnh `Release Stock` thêm một lần nữa. Lỗi logic xảy ra: Cùng 1 đơn hàng nhưng kho được cộng bù lại 2 lần!

**Giải pháp cài đặt:**
Thiết kế các API Compensating (Bù trừ) tuân thủ nguyên tắc **Idempotent** (Dù gọi 1 lần hay 100 lần thì trạng thái hệ thống vẫn chỉ thay đổi như kết quả của lần gọi đầu tiên).
*   Tại Catalog Service, với mỗi yêu cầu `Reserve`, `Release` hay `Commit`, payload truyền đi luôn kèm theo `order_id`.
*   Catalog Service sử dụng một bảng phụ (hoặc khóa duy nhất - Unique Constraint) để đánh dấu: `order_id` này đã được `Release` rồi.
*   Khi tín hiệu Retry thứ 2 của Order Service bay tới, Catalog Service kiểm tra thấy trạng thái `order_id` đã được giải quyết, nó sẽ bỏ qua việc cộng trừ toán học, và chỉ nhẹ nhàng trả về `200 OK` (Báo rằng mọi thứ đã ổn thỏa).

---

## 5. Đánh Giá Hiệu Quả Của Kiến Trúc

Việc áp dụng **Saga Orchestration** thông qua REST API kết hợp Background Workers cho luồng Đặt hàng đã mang lại các giá trị:

1. **Hiệu năng và Khả năng mở rộng (Scalability):** Hệ thống không sử dụng Khóa phân tán (Distributed Lock) hoặc thuật toán Two-Phase Commit (2PC - vốn bắt buộc các database phải chờ nhau cực kỳ lâu). Nhờ đó, hàng ngàn khách hàng có thể Checkout cùng lúc mà không gây thắt cổ chai ở tầng Database.
2. **Khả năng kiểm soát tập trung:** Do Order Service nắm giữ vai trò Orchestrator, quá trình fix bug hoặc chăm sóc khách hàng trở nên rất dễ dàng. Admin chỉ cần nhìn vào bảng Orders là biết chính xác giao dịch đang bị kẹt ở bước Giữ kho, hay Thanh toán, mà không phải truy vết log rải rác trên nhiều service.
3. **Tính chống chịu lỗi (Fault Tolerance):** Hệ thống được bọc bởi các lớp Compensating Transactions và Cronjob dọn dẹp Timeout, giúp kho hàng luôn luôn chính xác (Consistency) ngay cả khi các cổng thanh toán bên ngoài (Third-party) gặp sự cố sập nguồn mạng.

---
*Báo cáo kiến trúc hệ thống và giải pháp kỹ thuật - Project Sàn Thương Mại Điện Tử.*
