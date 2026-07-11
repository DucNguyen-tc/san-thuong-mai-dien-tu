import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
import database

def build_product_embeddings():
    """
    Huấn luyện mô hình TF-IDF từ mô tả sản phẩm và lưu vector 500 chiều vào Postgres.
    """
    print("Bắt đầu đọc sản phẩm từ Catalog DB...")
    
    # 1. Đọc dữ liệu từ catalog_db
    try:
        catalog_conn = database.get_catalog_db_conn()
        query = "SELECT id, name, description FROM products WHERE is_active = TRUE"
        df = pd.read_sql_query(query, catalog_conn)
        catalog_conn.close()
    except Exception as e:
        print(f"Lỗi khi kết nối hoặc đọc Catalog DB: {e}")
        return
        
    if df.empty:
        print("Không tìm thấy sản phẩm nào đang hoạt động để tính toán vector.")
        return
        
    print(f"Đọc thành công {len(df)} sản phẩm. Bắt đầu tính toán TF-IDF...")
    
    # Kết hợp tên sản phẩm và mô tả để tăng độ phong phú thông tin
    df['text'] = df['name'] + " " + df['description']
    
    # 2. Huấn luyện TF-IDF Vectorizer
    # Số lượng features tối đa cố định là 500 chiều, khớp với kiểu dữ liệu vector(500) trong DB
    vectorizer = TfidfVectorizer(max_features=500)
    tfidf_matrix = vectorizer.fit_transform(df['text'])
    
    # Chuyển đổi ma trận thưa (sparse matrix) thành numpy array
    embeddings = tfidf_matrix.toarray()
    
    # 3. Lưu/Cập nhật vào database product_vectors
    print("Bắt đầu đẩy vector đặc trưng vào Recommendation DB...")
    try:
        rec_conn = database.get_recommendation_db_conn()
        cur = rec_conn.cursor()
        
        # Sử dụng UPSERT (ON CONFLICT DO UPDATE) để tránh trùng lặp khóa chính
        for index, row in df.iterrows():
            product_id = row['id']
            # Chuyển đổi numpy array thành list kiểu float để psycopg2/pgvector hiểu
            vector = embeddings[index].tolist()
            
            cur.execute("""
                INSERT INTO product_vectors (product_id, embedding, computed_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (product_id)
                DO UPDATE SET embedding = EXCLUDED.embedding, computed_at = NOW();
            """, (product_id, vector))
            
        rec_conn.commit()
        cur.close()
        rec_conn.close()
        print("✅ Đã hoàn thành cập nhật vector đặc trưng cho tất cả sản phẩm!")
    except Exception as e:
        print(f"Lỗi khi ghi dữ liệu vào Recommendation DB: {e}")

if __name__ == "__main__":
    build_product_embeddings()
