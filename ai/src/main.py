import sys
import os

# Đảm bảo python có thể tìm thấy các module trong thư mục src
sys.path.append(os.path.join(os.path.dirname(__file__)))

import vectorizer

def main():
    print("==================================================")
    print("  SanThuongMai AI Service - Recommendation engine  ")
    print("==================================================")
    
    # Ở chế độ mặc định, chạy batch job để sinh vector cho tất cả sản phẩm
    vectorizer.build_product_embeddings()

if __name__ == "__main__":
    main()
