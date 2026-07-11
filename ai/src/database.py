import psycopg2
from pgvector.psycopg2 import register_vector
import config

def get_recommendation_db_conn():
    """
    Kết nối tới database recommendation_db và đăng ký extension pgvector.
    """
    conn = psycopg2.connect(config.DATABASE_URL)
    # Đăng ký vector type với connection để tự động chuyển đổi định dạng
    register_vector(conn)
    return conn

def get_catalog_db_conn():
    """
    Kết nối tới database catalog_db (để lấy danh sách sản phẩm phục vụ huấn luyện/tính toán).
    """
    conn = psycopg2.connect(config.CATALOG_DATABASE_URL)
    return conn
