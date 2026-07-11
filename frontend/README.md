# Hướng Dẫn Thiết Lập & Phát Triển Frontend (ReactJS)

Ứng dụng Frontend của sàn thương mại điện tử **SanThuongMai** được xây dựng trên nền tảng **ReactJS** sử dụng công cụ **Vite**, lập trình bằng **TypeScript**, thiết kế giao diện bằng **Tailwind CSS v4** và quản lý trạng thái bằng **Zustand**.

---

## 🛠️ Công Nghệ & Thư Viện Sử Dụng

-   **React & Vite:** Khởi tạo dự án Single Page App (SPA) với thời gian khởi động và HMR (Hot Module Replacement) siêu tốc.
-   **TypeScript:** Tăng độ an toàn khi phát triển nhờ kiểm soát kiểu dữ liệu tĩnh.
-   **Tailwind CSS v4:** Sử dụng thư viện CSS utility-first bản mới nhất với plugin tích hợp trực tiếp vào Vite `@tailwindcss/vite`, loại bỏ cấu hình PostCSS rườm rà.
-   **React Router DOM v6:** Quản lý định tuyến (routing) phía client-side.
-   **Zustand:** Thư viện quản lý State toàn cục siêu nhẹ (sử dụng cho Giỏ hàng và Trạng thái đăng nhập).
-   **Axios:** Thư viện gọi API kết nối đến Backend Gateway, tích hợp cơ chế tự động đính kèm Token và làm mới Token (Silent Refresh).
-   **React Hook Form & Zod:** Quản lý và xác thực biểu mẫu (Form Validation) an toàn.
-   **Lucide React:** Bộ icon giao diện hiện đại dạng vector SVG.

---

## 📂 Cấu Trúc Thư Mục

Cấu trúc mã nguồn của Frontend nằm hoàn toàn trong thư mục `src/`:

```text
src/
├── assets/             # Chứa tài nguyên hình ảnh, logo, icon cần compile
├── components/         # Chứa các React Components có thể tái sử dụng
│   ├── ui/             # UI Components cơ bản tự phát triển bằng Tailwind CSS
│   ├── product/        # Component riêng liên quan tới sản phẩm (ví dụ: ProductCard)
│   ├── cart/           # Component riêng liên quan tới giỏ hàng
│   └── layout/         # Component dựng khung trang (Header, Footer, Navbar)
├── hooks/              # Custom React Hooks tự viết
├── lib/                # Cấu hình thư viện (vd: Axios Client tại api-client.ts)
├── pages/              # Chứa các trang giao diện (tương ứng với các routes)
│   ├── auth/           # Login, Register
│   ├── dashboard/      # Trang thông tin tài khoản cá nhân, trang quản trị
│   ├── products/       # Trang danh mục sản phẩm, trang chi tiết sản phẩm
│   ├── cart/           # Trang giỏ hàng
│   ├── checkout/       # Trang thanh toán
│   └── Home.tsx        # Trang chủ
├── routes/             # Cấu hình luồng định tuyến Routing (AppRoutes.tsx)
├── services/           # Lớp gọi API để lấy dữ liệu từ Backend
├── store/              # Quản lý State toàn cục bằng Zustand (useCartStore, useAuthStore)
├── types/              # Định nghĩa các TypeScript interfaces dùng chung
├── utils/              # Các hàm bổ trợ (format tiền tệ, format ngày tháng, v.v.)
├── App.tsx             # Component gốc của ứng dụng
├── index.css           # Cấu hình CSS gốc và nạp Tailwind CSS v4
└── main.tsx            # Điểm entry khởi chạy chính của React
```

---

## 🚀 Hướng Dẫn Thiết Lập (Setup Guide)

Vui lòng thực hiện các bước sau để chạy dự án dưới máy local:

### Yêu Cầu Hệ Thống (Prerequisites)
- **Node.js** phiên bản từ `20.x` trở lên.

### Bước 1: Cài Đặt Các Thư Viện Phụ Thuộc
Truy cập vào thư mục `frontend` và cài đặt các package:
```bash
npm install
```

### Bước 2: Thiết Lập Biến Môi Trường (.env)
1. Tạo một file `.env` ở thư mục gốc của `frontend`.
2. Định nghĩa biến môi trường đường dẫn đến API Gateway của backend:
   ```env
   VITE_API_GATEWAY_URL="http://localhost:3000/api"
   ```

### Bước 3: Chạy Ứng Dụng Trong Chế Độ Phát Triển (Development)
Khởi động dev server của Vite:
```bash
npm run dev
```
Sau khi khởi chạy thành công, Vite sẽ cung cấp địa chỉ truy cập cục bộ (mặc định là `http://localhost:5173`). Bạn mở trình duyệt để xem giao diện.

### Bước 4: Biên Dịch Cho Môi Trường Production
Để kiểm tra tính hợp lệ của TypeScript và build đóng gói sản phẩm chạy thực tế:
```bash
npm run build
```
Mã nguồn sau khi được tối ưu hóa và nén sẽ được sinh ra ở thư mục `dist/`.

---

## 💡 Lưu Ý Dành Cho Lập Trình Viên

-   **Path Alias (`@/*`):** Dự án đã được cấu hình alias. Bạn có thể sử dụng ký tự `@` đại diện cho thư mục `src/` khi import (Ví dụ: `import { apiClient } from '@/lib/api-client'` thay vì `import { apiClient } from '../../lib/api-client'`).
-   **Unused Imports Error:** Trình biên dịch TypeScript được thiết lập chế độ kiểm tra nghiêm ngặt (`noUnusedLocals`). Bất kỳ thư viện hoặc biến nào được import mà không dùng đến sẽ báo lỗi khi chạy lệnh `build`. Hãy nhớ dọn dẹp các import thừa.
-   **Theme & Màu Sắc:** Để thay đổi hoặc mở rộng màu sắc của Tailwind CSS v4, bạn chỉnh sửa trực tiếp các biến CSS trong block `@theme` tại file [src/index.css](file:///c:/Users/DUC/Desktop/san-thuong-mai/frontend/src/index.css).
