# AI Service - Recommendation System

Dịch vụ AI chịu trách nhiệm trích xuất các đặc trưng văn bản của sản phẩm (Tên & Mô tả chi tiết) để chuyển đổi thành các **vector đặc trưng 500 chiều** bằng phương pháp **TF-IDF**. Các vector này được đồng bộ vào PostgreSQL (`recommendation_db`) giúp hệ thống tìm kiếm sản phẩm tương tự bằng thuật toán **Cosine Similarity** thời gian thực.

---

## 📂 Cấu Trúc Thư Mục

```text
ai/
├── src/
│   ├── config.py       # Đọc cấu hình từ file .env
│   ├── database.py     # Quản lý kết nối PostgreSQL (có đăng ký kiểu pgvector)
│   ├── vectorizer.py   # Code xử lý TF-IDF bằng scikit-learn và lưu vào DB
│   └── main.py         # Điểm khởi chạy chương trình (chạy tính toán hàng loạt)
├── .env.example        # File mẫu cấu hình biến môi trường
├── .gitignore          # Chặn file rác python, môi trường ảo venv, .env
├── requirements.txt    # Danh sách thư viện Python cần thiết
└── README.md           # Hướng dẫn thiết lập (file này)
```

---

## 🛠️ Hướng Dẫn Thiết Lập (Setup Guide)

Yêu cầu máy local của bạn đã được cài đặt **Python** (phiên bản từ `3.9` đến `3.12` được khuyên dùng).

### Bước 1: Khởi tạo Môi trường ảo (Virtual Environment)
Khuyến khích tạo môi trường ảo để cô lập các thư viện của dự án, tránh xung đột hệ thống:
1. Di chuyển vào thư mục `ai`:
   ```bash
   cd ai
   ```
2. Tạo môi trường ảo (tên thư mục là `venv`):
   ```bash
   python -m venv venv
   ```
3. Kích hoạt môi trường ảo:
   - **Trên Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Trên Windows (CMD):**
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **Trên macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

### Bước 2: Cài đặt các thư viện cần thiết
Chạy lệnh cài đặt các package trong file `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Bước 3: Cấu hình biến môi trường
1. Nhân bản file `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
2. Cập nhật thông tin đường dẫn kết nối PostgreSQL của bạn (nếu có thay đổi mật khẩu hoặc host). Mặc định cấu hình đang dùng tài khoản của Docker Compose (`admin` / `1234567`).

### Bước 4: Chạy đồng bộ hóa Vector sản phẩm
Để tính toán vector cho tất cả các sản phẩm đang có trong database `catalog_db` và đẩy sang `recommendation_db`, bạn chạy lệnh:
```bash
python src/main.py
```
Sau khi hoàn tất, bạn có thể vào pgAdmin 4 kiểm tra bảng `product_vectors` trong `recommendation_db` để thấy dữ liệu vector đã được cập nhật thành công!
