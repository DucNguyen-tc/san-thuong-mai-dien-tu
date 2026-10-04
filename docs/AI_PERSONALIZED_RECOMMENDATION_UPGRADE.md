# TÀI LIỆU NÂNG CẤP PHÂN HỆ GỢI Ý CÁ NHÂN HÓA NÂNG CAO (AI PERSONALIZED RECOMMENDATION)

## 1. Mục Tiêu và Ý Nghĩa
Nâng cấp cơ chế gợi ý hiện tại từ mức cơ bản thành hệ thống cá nhân hóa thông minh, hiển thị đúng sản phẩm khách hàng đang quan tâm dựa trên thói quen duyệt web và lịch sử mua sắm. Cải thiện tối đa trải nghiệm người dùng, giữ chân khách hàng (Retention) và gia tăng tỉ lệ chuyển đổi (Conversion Rate - CVR).

## 2. Mô Tả Chi Tiết Chức Năng Cần Nâng Cấp

### 2.1. Gợi ý cá nhân hóa theo từng người dùng (Personalized Feed)
- **Vị trí hiển thị:** Trang chủ (Home Page).
- **Cơ chế hoạt động:** Gợi ý danh sách sản phẩm ưu tiên dựa trên User Vector (Tổng hợp hành vi gần đây của người dùng).
- **Logic Trọng số:**
  - **Mua thành công (PURCHASE):** Hệ số x3.0 (Đại diện cho sở thích mua sắm bền vững).
  - **Thêm vào giỏ hàng (ADD_TO_CART):** Hệ số x2.0 (Ý định mua rõ ràng trong ngắn hạn).
  - **Đã xem (CLICK / VIEW):** Hệ số x1.0 (Quan tâm bề mặt).
- **Fallback (Trường hợp dữ liệu hành vi ít):** Quay về sử dụng Trending/Popular Items + Sản phẩm mới nhất.

### 2.2. Gợi ý sản phẩm tương tự thông minh (Smart Similar Products)
- **Vị trí hiển thị:** Trang chi tiết sản phẩm (Product Detail Page).
- **Cơ chế hoạt động:** Kết hợp Hybrid giữa Content-based Filtering (Cosine Similarity) và Hard Filtering.
- **Tiêu chí tối ưu:**
  - Tương đồng về TF-IDF Vector (Công năng, đặc tính, mô tả).
  - Cùng Brand (Thương hiệu) - Boost điểm (Cộng thêm 20%).
  - Cùng phân khúc giá (Price Range) - Lọc hoặc Boost điểm sản phẩm có chênh lệch giá tối đa ±30%.

### 2.3. Gợi ý sản phẩm thịnh hành (Trending & Popular Items)
- **Đối tượng:** Khách hàng chưa đăng nhập (Guest) hoặc User mới tinh (Cold Start).
- **Cơ chế hoạt động:** 
  - Tính điểm Popularity dựa trên số lượng VIEW và PURCHASE trong **7 ngày gần nhất**.
  - **Category Context:** Nếu user là Guest nhưng vừa click vào danh mục "Điện thoại", trang chủ tự động đẩy các sản phẩm Trending thuộc danh mục "Điện thoại" lên ưu tiên.

### 2.4. Cơ chế tránh lặp nội dung (Duplicate & Re-purchase Suppression)
- **Mục tiêu:** Ẩn hoặc giảm điểm (Negative Boost) các sản phẩm tránh gây khó chịu cho người dùng.
- **Tiêu chí ẩn/giảm điểm:**
  - Sản phẩm khách hàng vừa thanh toán thành công trong vòng **30 ngày qua** (loại trừ các ngành hàng FMCG - Hàng tiêu dùng nhanh có nhu cầu mua lại sớm).
  - Sản phẩm đang nằm sẵn trong Giỏ hàng (Cart).
  - Sản phẩm đã xuất hiện (Impression) quá 10 lần nhưng khách không Click.

## 3. Lộ Trình Chuyển Đổi Kỹ Thuật

Sự thay đổi tập trung 95% ở Logic Backend (`recommendation.service.ts`) và hoàn toàn tận dụng lại kiến trúc Microservices + `pgvector` đang có, hạn chế tối đa tác động vật lý tới cơ sở dữ liệu.

### Bước 1: Cập nhật cấu trúc Dữ Liệu (Tùy chọn nhẹ)
- **File tác động:** `backend/recommendation-service/prisma/schema.prisma`
- **Nhiệm vụ:** Bổ sung Enum `ADD_TO_CART` vào `RecommendationEventType` để theo dõi rõ ràng hành vi Thêm vào giỏ hàng. Chạy migration Prisma.

### Bước 2: Bổ sung Logic "Negative Boost & Time Window"
- **File tác động:** `backend/recommendation-service/src/services/recommendation.service.ts`
- **Nhiệm vụ:**
  - Sửa đổi hàm `getPopularProducts` để chỉ query log trong thời gian `created_at >= NOW() - 7 days`.
  - Sửa API gợi ý để có tham số `excludeProductIds` (truyền các ID sản phẩm vừa mua từ Order Service / hoặc trong Cart từ Cart Service).

### Bước 3: Tối ưu thuật toán Gợi ý Sản phẩm Tương tự
- **Nhiệm vụ:** Kết nối / Gọi Internal API sang `catalog-service` để truy vấn metadata (Price, Brand).
- Áp dụng hệ số kích điểm (Boost Score) vào toán tử tính Cosine Similarity (`<=>`) nếu trùng Brand hoặc trong khoảng Giá mong muốn.

### Bước 4: Xây dựng Personalized Feed (User Vector)
- **Nhiệm vụ:** Viết hàm `getUserPersonalizedRecommendations(userId: string)` tổng hợp `recommendation_logs` của userId theo trọng số kiện (View, Cart, Purchase) để xuất ra Vector Ưu tiên và Suggest.
- **Tích hợp Frontend:** Đảm bảo Web client (Home.tsx, Recommendation.tsx) push event tương tác của người dùng qua Message Queue (RabbitMQ) hoặc API tới dịch vụ Recommendation kịp thời.

## 4. Kết Quả Mong Đợi
1. **Trải nghiệm khách hàng:** Giao diện trang chủ và chi tiết sản phẩm không bị tĩnh/nhàm chán. "Sống" theo hành vi tức thời của từng User.
2. **Kỹ thuật:** Hệ thống Gợi ý hoạt động Hybrid mượt mà, chịu tải cao do việc tính toán Vector và Cosine Similarity đều được Delegate cho DB (`pgvector`).
3. **Kinh doanh:** Tăng thời gian lưu trang (Time on Site) và khả năng chuyển đổi chéo (Cross-selling).
