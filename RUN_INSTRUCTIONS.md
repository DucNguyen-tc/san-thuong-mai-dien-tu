# Hướng Dẫn Chạy & Khởi Động Dự Án (Sau Khi Hoàn Thành Tuần 3)

Tài liệu này ghi lại toàn bộ những cập nhật vừa được thực hiện để nâng cấp tính năng **Gợi Ý Sản Phẩm AI (Tuần 3)** và các bước chạy lại dự án từ đầu (rất hữu ích sau khi bạn khởi động lại máy tính).

---

## 1. Tóm Tắt Những Cập Nhật Đã Làm
- **Backend - Recommendation Service**:
  - Viết lại thuật toán gợi ý sản phẩm lai (Hybrid Recommendation) kết hợp: **Content-based Filtering (60%)** và **Collaborative Filtering (40%)**.
  - Thêm endpoint `GET /popular` để lấy các sản phẩm phổ biến nhất đưa ra trang chủ.
  - Sửa `docker-compose.yml` (bỏ cờ `version: "3.8"`) để tránh lỗi PowerShell đóng tiến trình Docker do cảnh báo.
- **Backend - Catalog Service**:
  - Tạo bộ dữ liệu hạt giống (Seed Data) chuẩn xác với 57 sản phẩm thực tế chia ra 7 danh mục (điện thoại, laptop gaming, văn phòng, chuột, phím, tai nghe).
  - Tối ưu `seed.ts` để các sản phẩm này bắn đầy đủ sự kiện qua RabbitMQ sang Recommendation Service.
- **Frontend**:
  - Tạo `recommendationService.ts` chuyên biệt để giao tiếp với AI API.
  - Cập nhật trang chủ (`AIRecommendations.tsx`) để lấy dữ liệu gợi ý thật từ API thay vì mock data.
  - Cập nhật component sản phẩm tương tự (`SimilarProducts.tsx`) để lưu lại lịch sử người dùng (Impression, Click) nhằm huấn luyện thêm cho thuật toán Collaborative Filtering.

---

## 2. Các Bước Khởi Động Lại Hệ Thống (Sau Khi Restart Máy)

Hãy mở Terminal (như PowerShell) trong VS Code ở thư mục gốc của dự án (`q:\san-thuong-mai-dien-tu`) và thực hiện lần lượt các bước sau:

### Bước 1: Khởi động hệ sinh thái Docker (Database & RabbitMQ)
Chạy lệnh sau để bật PostgreSQL và RabbitMQ. 
*(Lưu ý: Sử dụng `docker compose` thay vì `docker-compose` cũ)*
```powershell
docker compose up -d
```
Đợi khoảng 5-10 giây để các container khởi động hoàn toàn.

### Bước 2: Bật các Microservices
Mở nhiều tab Terminal khác nhau và khởi động các dịch vụ (bắt buộc phải bật Recommendation Service trước khi chạy seed):

**Tab 1 - Recommendation Service:**
```powershell
cd backend/recommendation-service
npm run dev
```

**Tab 2 - Catalog Service:**
```powershell
cd backend/catalog-service
npm run dev
```

**Tab 3 - API Gateway:**
```powershell
cd backend/api-gateway
npm run dev
```

**Tab 4 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Bước 3: Tạo Dữ Liệu Seed (Hạt Giống)

Đây là bước quan trọng để nạp dữ liệu AI. Bạn mở một Tab Terminal mới và chạy:

**1. Seed dữ liệu cho Catalog (57 Sản phẩm):**
```powershell
cd backend/catalog-service
npx prisma db seed
```
*(Lưu ý: Quá trình này mất khoảng 3-5 phút vì hệ thống AI sẽ phải chạy model để tạo vector nhúng (embedding) cho 57 sản phẩm. Xin hãy kiên nhẫn chờ Terminal báo thành công)*

**2. Seed dữ liệu hành vi người dùng (Cho Collaborative Filtering):**
Sau khi bước trên xong, tiến hành chạy seed cho AI:
```powershell
cd backend/recommendation-service
npx prisma db seed
```

### Bước 4: Kiểm tra thành quả!
- Truy cập frontend (thường là `http://localhost:5173`).
- Ở trang chủ, mục **"Dành riêng cho bạn"** giờ sẽ hiển thị các sản phẩm phổ biến nhất lấy từ API.
- Bấm vào một điện thoại (VD: iPhone 16 Pro Max), lướt xuống mục **"Sản phẩm tương tự"**, AI sẽ gợi ý các điện thoại cao cấp khác!
