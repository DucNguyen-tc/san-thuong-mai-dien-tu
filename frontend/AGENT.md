# Quy tắc Bắt buộc Khi Làm Việc Với Frontend (AGENT.md)

Tài liệu này quy định các chuẩn mực thiết kế, cấu trúc thư mục, quy tắc viết mã và quản lý state bắt buộc cho phần Frontend (ReactJS) của dự án **san-thuong-mai**.

---

## 1. Cấu Trúc Thư Mục & Quản Lý File

Mọi mã nguồn Frontend phải nằm trong thư mục `src/` và tuân thủ tuyệt đối cấu trúc thư mục sau:
*   `src/components/ui/`: Chứa các UI components dùng chung, có tính tái sử dụng cao (nút, ô nhập liệu, modal, card chung).
*   `src/components/[domain]/`: Chứa các component thuộc về nghiệp vụ cụ thể như `product/`, `cart/`, `layout/` (Header, Footer).
*   `src/pages/`: Chứa các trang hoàn chỉnh, **bắt buộc phân chia theo role**:
    *   `src/pages/user/`: Các trang dành cho Khách hàng (Home, ProductList, ProductDetail, Cart, Checkout, v.v.).
    *   `src/pages/admin/`: Các trang dành cho Admin (Dashboard, QuanLySanPham, QuanLyDonHang, v.v.).
    *   `src/pages/auth/`: Các trang xác thực dùng chung (Login, Register).
    *   `src/pages/PageNotFound.tsx`: Trang 404 dùng chung.
    *   **Không** đặt file `.tsx` trực tiếp trong thư mục gốc `src/pages/` (ngoại trừ `PageNotFound.tsx`).
*   `src/routes/`: Cấu hình định tuyến với **một file route chính duy nhất** (`AppRoutes.tsx`) và các file route con theo từng role:
    *   `src/routes/AppRoutes.tsx`: **File route chính**, import và tổ hợp toàn bộ route từ các file con. Chỉ có file này được đăng ký vào `App.tsx`.
    *   `src/routes/UserRoutes.tsx`: Khai báo tất cả routes thuộc khu vực người dùng (`/`, `/products`, `/cart`, `/checkout`, v.v.). Wrap bằng `UserLayout` (Header + Footer).
    *   `src/routes/AdminRoutes.tsx`: Khai báo tất cả routes thuộc khu vực admin (`/admin/*`). Wrap bằng `AdminLayout` (Sidebar + Header). **Bắt buộc** bảo vệ bằng `ProtectedRoute` kiểm tra role `ADMIN`.
    *   `src/routes/ProtectedRoute.tsx`: HOC kiểm tra `isAuthenticated` và `role` từ `useAuthStore`. Redirect về `/login` nếu chưa đăng nhập, về `/` nếu không đủ quyền.
*   `src/services/`: Lớp gọi API để kết nối trực tiếp đến backend (ví dụ: `authService.ts`, `productService.ts`).
*   `src/store/`: Quản lý state toàn cục bằng Zustand (ví dụ: `useCartStore.ts`, `useAuthStore.ts`).
*   `src/hooks/`: Chứa các React Custom Hooks tự định nghĩa (ví dụ: `useAuth`, `useLocalStorage`).
*   `src/lib/`: Nơi cấu hình các thư viện bên ngoài, đặc biệt là `api-client.ts` (Axios instance).
*   `src/types/`: Khai báo các TypeScript Interface và Type dùng chung.
*   `src/utils/`: Các hàm tiện ích dùng chung (định dạng tiền tệ, định dạng ngày tháng, kiểm tra chuỗi, v.v.).

---

## 2. Quy Tắc Import & Path Alias (`@/*`)

*   **Bắt buộc** sử dụng ký tự `@/` đại diện cho thư mục `src/` khi thực hiện import các file trong dự án.
*   **Không sử dụng** đường dẫn tương đối dài dòng (như `../../components/...`).
    *   *Đúng:* `import { Button } from '@/components/ui/button'`
    *   *Sai:* `import { Button } from '../../components/ui/button'`

---

## 3. Quy Tắc Lập Trình React & TypeScript

### 3.1. Type Safety
*   **Không sử dụng `any`:** Định nghĩa kiểu dữ liệu (Props, State, API Response, API Payload) rõ ràng bằng Interface hoặc Type.
*   Sử dụng `noUnusedLocals` được thiết lập sẵn trong dự án: **Mọi thư viện hoặc biến được import mà không dùng đến sẽ gây lỗi biên dịch (build error).** Hãy dọn dẹp import thừa trước khi commit/push.

### 3.2. Quản Lý Component & Hook
*   Sử dụng Functional Components và Hooks. Không sử dụng Class Components.
*   Khi sử dụng `useEffect`, **bắt buộc** phải trả về hàm cleanup để dọn dẹp các sự kiện lắng nghe (event listener), xóa timer (setTimeout, setInterval), hoặc hủy các yêu cầu API (AbortController) khi component bị unmount.

---

## 4. Quản Lý State (State Management)

*   **Zustand (Global State):** Chỉ dùng Zustand cho các trạng thái thực sự cần chia sẻ toàn cục trong toàn bộ ứng dụng (Ví dụ: trạng thái đăng nhập `authStore`, giỏ hàng `cartStore`).
*   **Local State (`useState`):** Trạng thái hiển thị cục bộ (ví dụ: mở/đóng modal, trạng thái loading của nút bấm, dữ liệu tạm thời của form) phải được quản lý cục bộ bằng `useState` của React. Không đưa các dữ liệu mang tính UI cục bộ này vào Zustand.

---

## 5. Kết Nối API & Gọi Mạng

*   **Bắt buộc** sử dụng Axios instance đã được định cấu hình sẵn tại `src/lib/api-client.ts`.
*   **Không tự khởi tạo** các instance axios mới trong component hay service để tránh mất cấu hình interceptors.
*   **Cơ chế Interceptor:** Dự án đã thiết lập tự động đính kèm `access_token` từ `localStorage` và tự động thực hiện Silent Refresh bằng `refresh_token` khi gặp lỗi `401` (hết hạn Token). Nếu refresh thất bại, hệ thống tự động xóa token và chuyển hướng về trang `/login`.
*   **Trải nghiệm người dùng:** Mọi tác vụ gọi API phải có trạng thái loading (để hiển thị spinner/skeleton) và xử lý lỗi lịch sự (hiển thị thông báo qua Toast/Alert), tránh việc để ứng dụng bị crash hoặc hiển thị lỗi raw từ server cho người dùng.

---

## 6. Giao Diện & Styling (Tailwind CSS v4)

*   Sử dụng phương pháp **Utility-First** của Tailwind CSS v4 để định dạng giao diện.
*   Hạn chế viết CSS tùy chỉnh trừ khi thực sự cần thiết.
*   **Theme & Colors:** Mọi thay đổi về màu sắc chủ đạo, font chữ hoặc các biến CSS dùng chung phải được khai báo trong khối `@theme` tại file `src/index.css`.
*   **Aesthetics:** Thiết kế giao diện cần có sự nhất quán, sử dụng các hiệu ứng hover, active mượt mà và đảm bảo hỗ trợ hiển thị tốt trên nhiều kích thước màn hình (Responsive).

---

## 7. Biểu Mẫu & Validate Dữ Liệu (Form Handling)

*   Sử dụng kết hợp **React Hook Form** và **Zod** để xử lý trạng thái và kiểm định dữ liệu của form ở phía client trước khi gửi lên backend.
*   Hiển thị thông báo lỗi chi tiết, rõ ràng ngay dưới các trường nhập liệu tương ứng khi dữ liệu không hợp lệ.

---

## 8. Biến Môi Trường (.env)

*   Biến môi trường được truy cập qua cú pháp: `import.meta.env.VITE_API_GATEWAY_URL`.
*   **Không commit** file `.env` lên Git. Mọi biến môi trường mới cần thiết phải được cập nhật hướng dẫn cấu hình vào file hướng dẫn thiết lập.
