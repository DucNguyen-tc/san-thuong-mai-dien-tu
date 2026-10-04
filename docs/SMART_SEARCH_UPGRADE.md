# NÂNG CẤP HỆ THỐNG TÌM KIẾM THÔNG MINH

## Từ SQL ILIKE → Elasticsearch + Hybrid Search + Visual Search

> **Phiên bản:** 1.0  
> **Ngày tạo:** 2026-09-23  
> **Tác giả:** AI Assistant  
> **Trạng thái:** Đề xuất thiết kế — Chờ phê duyệt

---

## MỤC LỤC

1. [Tổng quan & Mục tiêu](#1-tổng-quan--mục-tiêu)
2. [Phân tích hệ thống hiện tại](#2-phân-tích-hệ-thống-hiện-tại)
3. [Kiến trúc hệ thống sau nâng cấp](#3-kiến-trúc-hệ-thống-sau-nâng-cấp)
4. [Chi tiết 6 chức năng tìm kiếm](#4-chi-tiết-6-chức-năng-tìm-kiếm)
5. [Thiết kế Elasticsearch Index](#5-thiết-kế-elasticsearch-index)
6. [Thiết kế Search Service (Backend)](#6-thiết-kế-search-service-backend)
7. [Cơ chế đồng bộ dữ liệu PostgreSQL → Elasticsearch](#7-cơ-chế-đồng-bộ-dữ-liệu-postgresql--elasticsearch)
8. [Thiết kế Frontend (Search UI)](#8-thiết-kế-frontend-search-ui)
9. [Thiết kế Visual Search (Tìm kiếm bằng hình ảnh)](#9-thiết-kế-visual-search-tìm-kiếm-bằng-hình-ảnh)
10. [Thay đổi hạ tầng Docker](#10-thay-đổi-hạ-tầng-docker)
11. [Kế hoạch triển khai theo giai đoạn](#11-kế-hoạch-triển-khai-theo-giai-đoạn)
12. [Rủi ro & Giải pháp](#12-rủi-ro--giải-pháp)

---

## 1. TỔNG QUAN & MỤC TIÊU

### 1.1. Vấn đề hiện tại

Hệ thống tìm kiếm hiện tại sử dụng **SQL Substring Matching** (Prisma `contains` → SQL `ILIKE '%keyword%'`) với các hạn chế:

- Không hỗ trợ tiếng Việt không dấu (gõ "dien thoai" → không tìm thấy "Điện thoại")
- Không xử lý được lỗi chính tả (gõ "iphoen" → không kết quả)
- Không có gợi ý từ khóa thời gian thực (autocomplete)
- Tốc độ giảm đáng kể khi dữ liệu tăng (full table scan)
- Không hỗ trợ tìm kiếm theo ngữ nghĩa/ý định người dùng
- Không hỗ trợ tìm kiếm bằng hình ảnh

### 1.2. Mục tiêu nâng cấp

| # | Chức năng | Mô tả |
|---|-----------|-------|
| 1 | **Full-text Search & Tiếng Việt** | Tìm kiếm toàn văn, hỗ trợ có dấu / không dấu, tách từ tiếng Việt |
| 2 | **Fuzzy Search** | Tự động sửa lỗi chính tả (Levenshtein Distance ≤ 2 ký tự) |
| 3 | **Autocomplete & Prefix Search** | Gợi ý từ khóa & sản phẩm theo thời gian thực khi gõ |
| 4 | **Faceted Search & Filter** | Lọc kết hợp: khoảng giá, danh mục, màu sắc, khuyến mãi |
| 5 | **Hybrid Search** | Kết hợp tìm kiếm từ khóa (BM25) + ngữ nghĩa (Vector/kNN) |
| 6 | **Visual Search** | Tìm kiếm sản phẩm bằng hình ảnh (upload/chụp camera) |

### 1.3. Nguyên tắc thiết kế

- **Không thay đổi PostgreSQL hiện tại** — PostgreSQL vẫn là Source of Truth
- **Không phá vỡ API hiện có** — Các endpoint cũ vẫn hoạt động bình thường
- **Tách biệt thành microservice mới** — Tạo `search-service` riêng biệt
- **Triển khai theo giai đoạn** — Có thể bật/tắt từng chức năng độc lập

---

## 2. PHÂN TÍCH HỆ THỐNG HIỆN TẠI

### 2.1. Kiến trúc Microservices đang chạy

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                           │
├─────────────┬───────────────────────────────────────────────────┤
│ Hạ tầng     │ PostgreSQL (pgvector:pg16) ║ RabbitMQ            │
├─────────────┼───────────────────────────────────────────────────┤
│ Gateway     │ API Gateway (:3000)                               │
├─────────────┼───────────────────────────────────────────────────┤
│ Services    │ identity (:3001)  │ catalog (:3002)               │
│             │ cart     (:3003)  │ order   (:3004)               │
│             │ payment  (:3005)  │ notification (:3006)          │
│             │ recommendation (:3007)                            │
└─────────────┴───────────────────────────────────────────────────┘
```

### 2.2. Luồng tìm kiếm hiện tại

```
[Frontend Header.tsx]
       │ Người dùng gõ từ khóa → Submit form
       │ Chuyển hướng: /products?search=<keyword>
       ▼
[ProductList.tsx]
       │ Gọi getProducts({ search: keyword })
       ▼
[productService.ts]
       │ GET /api/catalog/products?search=<keyword>
       ▼
[API Gateway :3000]
       │ Proxy → catalog-service
       ▼
[Catalog Service :3002]
       │ product.controller.ts → productService.getAll()
       ▼
[product.service.ts]
       │ Prisma query:
       │   OR: [
       │     { name: { contains: search, mode: 'insensitive' } },
       │     { category: { name: { contains: search, mode: 'insensitive' } } }
       │   ]
       ▼
[PostgreSQL]
       │ SQL: WHERE name ILIKE '%keyword%' OR category.name ILIKE '%keyword%'
       ▼
[Trả về kết quả cho Frontend]
```

### 2.3. Schema cơ sở dữ liệu liên quan (catalog_db)

```
┌─────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│   categories    │     │      products         │     │ product_variants  │
├─────────────────┤     ├──────────────────────┤     ├───────────────────┤
│ id (UUID)       │◄────│ category_id (FK)      │     │ id (UUID)         │
│ name            │     │ id (UUID)             │◄────│ product_id (FK)   │
│ slug            │     │ name                  │     │ attributes (JSON) │
│ parent_id (FK)  │     │ slug                  │     │ price (Decimal)   │
│ created_at      │     │ description           │     │ stock_quantity    │
│ updated_at      │     │ is_active             │     │ is_active         │
└─────────────────┘     │ created_at            │     └───────────────────┘
                        │ updated_at            │
                        └──────────────────────┘
                                 │
                        ┌────────┴────────┐
                        ▼                 ▼
               ┌─────────────────┐ ┌──────────────────┐
               │ product_images  │ │ promotion_items   │
               ├─────────────────┤ ├──────────────────┤
               │ id (BigInt)     │ │ id (BigInt)       │
               │ product_id (FK) │ │ promotion_id (FK) │
               │ variant_id (FK) │ │ product_id (FK)   │
               │ url             │ │ variant_id (FK)   │
               │ is_primary      │ └──────────────────┘
               │ sort_order      │
               └─────────────────┘
```

### 2.4. Tài nguyên hiện có có thể tận dụng

| Tài nguyên | Chi tiết | Ý nghĩa cho nâng cấp |
|------------|----------|----------------------|
| **pgvector/pgvector:pg16** | Image PostgreSQL đã cài sẵn extension pgvector | Có thể dùng làm fallback cho vector search (không bắt buộc) |
| **RabbitMQ** | Exchange `product.events` (topic) đã được khai báo | Dùng ngay để đồng bộ dữ liệu sang Elasticsearch |
| **publisher.ts** | Catalog service đã có code publish event (đang bị comment) | Chỉ cần bỏ comment và bổ sung routing key |

---

## 3. KIẾN TRÚC HỆ THỐNG SAU NÂNG CẤP

### 3.1. Sơ đồ kiến trúc tổng thể

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                                │
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │ SearchBar +       │  │ ProductList +     │  │ Visual Search          │  │
│  │ Autocomplete      │  │ Faceted Filters   │  │ (Upload/Camera)        │  │
│  │ (debounce 150ms)  │  │                   │  │                        │  │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────┬────────────┘  │
│           │                     │                         │               │
└───────────┼─────────────────────┼─────────────────────────┼───────────────┘
            │                     │                         │
            ▼                     ▼                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (:3000)                                │
│                                                                           │
│  /api/search/suggest     → Search Service (Autocomplete)                  │
│  /api/search/products    → Search Service (Full-text + Hybrid)            │
│  /api/search/visual      → Search Service (Visual Search)                 │
│  /api/catalog/*          → Catalog Service (CRUD - không thay đổi)        │
│                                                                           │
└──────────────────────────────┬────────────────────────────────────────────┘
                               │
              ┌────────────────┼─────────────────────┐
              ▼                ▼                     ▼
┌──────────────────┐  ┌───────────────────┐  ┌───────────────────────────┐
│  Catalog Service │  │  Search Service   │  │   Các service khác        │
│  (:3002)         │  │  (:3008) [MỚI]    │  │   (cart, order, ...)      │
│                  │  │                   │  │                           │
│  - CRUD Products │  │  - Autocomplete   │  │   Không thay đổi         │
│  - Prisma/PG     │  │  - Full-text      │  │                           │
│  - Publish event │  │  - Fuzzy          │  └───────────────────────────┘
│    khi CUD       │  │  - Faceted Filter │
│                  │  │  - Hybrid Search  │
└────────┬─────────┘  │  - Visual Search  │
         │            │                   │
         │            │  Kết nối:         │
         │            │  - Elasticsearch  │
         │            │  - OpenAI API     │
         │            │  - RabbitMQ       │
         │            └─────────┬─────────┘
         │                      │
         │  ┌───────────────────┘
         │  │
         ▼  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        HẠ TẦNG (Infrastructure)                       │
│                                                                       │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │ PostgreSQL   │  │ Elasticsearch    │  │ RabbitMQ               │  │
│  │ (pgvector)   │  │ 8.x             │  │                        │  │
│  │              │  │                  │  │ Exchange:              │  │
│  │ Source of    │  │ - products index │  │   product.events       │  │
│  │ Truth        │  │ - dense_vector   │  │                        │  │
│  │              │  │   (text + image) │  │ Routing Keys:          │  │
│  │ Không thay   │  │                  │  │   product.created      │  │
│  │ đổi gì      │  │ [THÊM MỚI]      │  │   product.updated      │  │
│  │              │  │                  │  │   product.deleted       │  │
│  └──────────────┘  └──────────────────┘  └────────────────────────┘  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2. Luồng dữ liệu chính

#### Luồng 1: Đồng bộ dữ liệu (Data Sync Pipeline)

```
Admin tạo/sửa/xóa sản phẩm
       │
       ▼
[Catalog Service]
       │ 1. Ghi vào PostgreSQL (Prisma)
       │ 2. Publish event qua RabbitMQ
       │    routing key: product.created / product.updated / product.deleted
       ▼
[RabbitMQ] ──── Exchange: product.events (topic) ────►
       │
       ▼
[Search Service] ──── Consumer lắng nghe event
       │
       │ 3a. Nhận dữ liệu sản phẩm từ event
       │ 3b. Gọi OpenAI API để sinh Text Embedding (cho tên + mô tả)
       │ 3c. Gọi OpenAI CLIP API để sinh Image Embedding (cho ảnh sản phẩm)
       │ 3d. Ghi document vào Elasticsearch index
       ▼
[Elasticsearch]
       Lưu trữ: text fields + text_vector + image_vector
```

#### Luồng 2: Tìm kiếm từ khóa (Full-text / Fuzzy / Hybrid)

```
Người dùng gõ từ khóa tại SearchBar
       │
       ▼
[Frontend] ──── debounce 300ms ────►
       │
       │ (A) Autocomplete: GET /api/search/suggest?q=<partial_keyword>
       │ (B) Full Search:  GET /api/search/products?q=<keyword>&filters=...
       ▼
[API Gateway] → proxy → [Search Service]
       │
       │ 1. Phân tích query: chuẩn hóa Unicode (NFC), bỏ dấu (ASCII folding)
       │ 2. Xây dựng Elasticsearch query:
       │    - multi_match (BM25) trên các text fields (fuzzy enabled)
       │    - knn search trên text_vector (semantic similarity)
       │    - Kết hợp điểm BM25 + kNN bằng trọng số (0.7 / 0.3)
       │    - Aggregations cho faceted filters
       │ 3. Trả về kết quả + facet counts
       ▼
[Elasticsearch]
       │ Thực thi truy vấn (< 30ms)
       ▼
[Search Service]
       │ Map kết quả → response format
       ▼
[Frontend]
       │ Hiển thị danh sách sản phẩm + bộ lọc động
```

#### Luồng 3: Tìm kiếm bằng hình ảnh (Visual Search)

```
Người dùng upload ảnh / chụp camera
       │
       ▼
[Frontend] ──── POST multipart/form-data ────►
       │
       │ POST /api/search/visual
       │ Body: { image: <file> }
       ▼
[API Gateway] → proxy → [Search Service]
       │
       │ 1. Nhận file ảnh
       │ 2. Gọi OpenAI CLIP API → sinh Image Embedding vector
       │ 3. Gửi kNN query tới Elasticsearch:
       │    tìm các document có image_vector gần nhất (cosine similarity)
       │ 4. Trả về danh sách sản phẩm tương đồng + confidence score
       ▼
[Elasticsearch]
       │ kNN search trên trường image_vector (< 50ms)
       ▼
[Search Service]
       │ Sắp xếp theo similarity score (cao → thấp)
       ▼
[Frontend]
       │ Hiển thị grid sản phẩm tương tự + % độ tương đồng
```

---

## 4. CHI TIẾT 6 CHỨC NĂNG TÌM KIẾM

### 4.1. Full-text Search & Xử lý Tiếng Việt

#### Cơ chế hoạt động

Elasticsearch sử dụng **Custom Analyzer** được cấu hình đặc biệt cho tiếng Việt:

```
Input: "Điện thoại Samsung Galaxy"
          │
          ▼
┌─────────────────────────────────────────────────────┐
│              ANALYSIS PIPELINE                       │
│                                                      │
│  1. ICU Normalizer (NFC)                             │
│     "Điện thoại Samsung Galaxy"                      │
│          │                                           │
│  2. ICU Folding (bỏ dấu)                            │
│     "dien thoai samsung galaxy"                      │
│          │                                           │
│  3. Lowercase Filter                                 │
│     "dien thoai samsung galaxy"                      │
│          │                                           │
│  4. Vietnamese Tokenizer (tách từ)                   │
│     ["dien", "thoai", "samsung", "galaxy"]           │
│          │                                           │
│  5. Edge N-gram Filter (cho autocomplete)            │
│     ["d","di","die","dien","t","th","tho","thoa",    │
│      "thoai","s","sa","sam","sams","samsu","samsun", │
│      "samsung","g","ga","gal","gala","galax",        │
│      "galaxy"]                                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### Ví dụ truy vấn

| Người dùng gõ | Elasticsearch tìm | Kết quả |
|---------------|-------------------|---------|
| `điện thoại` | Match trên trường `name` (có dấu) | ✅ Tìm thấy "Điện thoại Samsung Galaxy" |
| `dien thoai` | Match trên trường `name.folded` (không dấu) | ✅ Tìm thấy "Điện thoại Samsung Galaxy" |
| `Samsung` | Match trên trường `name` | ✅ Tìm thấy tất cả sản phẩm Samsung |

### 4.2. Fuzzy Search (Xử lý lỗi chính tả)

#### Cơ chế hoạt động

Sử dụng thuật toán **Levenshtein Distance** (Edit Distance) tích hợp sẵn trong Elasticsearch:

```
Levenshtein Distance = Số phép biến đổi tối thiểu (thêm/xóa/thay ký tự)
để chuyển chuỗi A thành chuỗi B.

Ví dụ:
  "iphoen" → "iphone"  =  1 phép hoán vị (swap o↔e)  → Distance = 1  ✅ Match
  "samsug" → "samsung" =  1 phép thêm (thêm 'n')     → Distance = 1  ✅ Match
  "nokiaa" → "nokia"   =  1 phép xóa (xóa 'a' thừa)  → Distance = 1  ✅ Match
```

#### Cấu hình Fuzziness

```
fuzziness: "AUTO"

Quy tắc AUTO theo chiều dài từ:
  - 0-2 ký tự  → không fuzzy (phải gõ đúng)
  - 3-5 ký tự  → cho phép sai 1 ký tự
  - 6+ ký tự   → cho phép sai 2 ký tự
```

### 4.3. Autocomplete & Prefix Search

#### Cơ chế hoạt động

```
Người dùng gõ: "i" → "ip" → "iph" → "ipho" → "iphon"
                 │      │      │       │        │
                 ▼      ▼      ▼       ▼        ▼
           [Mỗi ký tự → debounce 150ms → gọi API /search/suggest]
                                                  │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │ Elasticsearch query:     │
                                    │ - completion suggester   │
                                    │ - edge_ngram matching    │
                                    │ - prefix query           │
                                    └──────────┬──────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────────┐
                                    │ Response (< 20ms):       │
                                    │                          │
                                    │ Từ khóa gợi ý:           │
                                    │ • iPhone 15 Pro Max      │
                                    │ • iPhone 14              │
                                    │ • iPhone case            │
                                    │                          │
                                    │ Sản phẩm gợi ý:          │
                                    │ • 📱 iPhone 15 Pro Max   │
                                    │   128GB - 27.990.000₫    │
                                    │ • 📱 iPhone 14 Plus      │
                                    │   256GB - 19.990.000₫    │
                                    └─────────────────────────┘
```

#### Endpoint API

```
GET /api/search/suggest?q=<partial_keyword>&limit=5

Response:
{
  "keywords": [
    { "text": "iPhone 15 Pro Max", "highlight": "<em>iPho</em>ne 15 Pro Max" },
    { "text": "iPhone 14", "highlight": "<em>iPho</em>ne 14" }
  ],
  "products": [
    {
      "id": "uuid-...",
      "name": "iPhone 15 Pro Max 128GB",
      "image_url": "https://...",
      "price": 27990000,
      "discounted_price": 25990000
    }
  ]
}
```

### 4.4. Faceted Search & Filter (Bộ lọc thuộc tính linh hoạt)

#### Cơ chế hoạt động

Elasticsearch **Aggregations** cho phép vừa trả kết quả tìm kiếm, vừa thống kê động các tiêu chí lọc trong cùng 1 request:

```
Request: GET /api/search/products?q=áo&category_id=xxx&price_min=100000&price_max=500000

┌──────────────────────────────────────────────────────────────┐
│              ELASTICSEARCH QUERY                              │
│                                                               │
│  bool: {                                                      │
│    must: [                                                    │
│      multi_match: { query: "áo", fields: [...] }  ← Tìm kiếm│
│    ],                                                         │
│    filter: [                                                  │
│      term: { category_id: "xxx" },          ← Lọc danh mục   │
│      range: { price: { gte: 100000, lte: 500000 } } ← Lọc giá│
│    ]                                                          │
│  },                                                           │
│  aggs: {                           ← Thống kê bộ lọc động     │
│    categories:  { terms: { field: "category_name" } },        │
│    price_ranges: { range: { field: "price", ranges: [...] } },│
│    colors:      { terms: { field: "attributes.color" } },     │
│    has_discount: { filter: { term: { has_discount: true } } } │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
```

#### Response format

```json
{
  "items": [ ... ],            // Danh sách sản phẩm khớp
  "pagination": { ... },       // Phân trang
  "facets": {                  // Bộ lọc động (aggregation results)
    "categories": [
      { "key": "Áo thun", "count": 45 },
      { "key": "Áo sơ mi", "count": 23 },
      { "key": "Áo khoác", "count": 12 }
    ],
    "price_ranges": [
      { "key": "Dưới 200k", "from": 0, "to": 200000, "count": 30 },
      { "key": "200k - 500k", "from": 200000, "to": 500000, "count": 35 },
      { "key": "Trên 500k", "from": 500000, "count": 15 }
    ],
    "colors": [
      { "key": "Đen", "count": 28 },
      { "key": "Trắng", "count": 22 },
      { "key": "Xanh", "count": 15 }
    ],
    "discount_count": 18
  }
}
```

### 4.5. Hybrid Search (Tìm kiếm kết hợp ngữ nghĩa)

#### Cơ chế hoạt động

Kết hợp 2 phương pháp tìm kiếm song song trong cùng 1 truy vấn:

```
Input: "laptop cho sinh viên giá rẻ"
          │
          ├──────────────────────────────────────────────┐
          │                                              │
          ▼                                              ▼
┌─────────────────────────┐              ┌──────────────────────────────┐
│  LEXICAL SEARCH (BM25)  │              │  SEMANTIC SEARCH (kNN)       │
│                         │              │                              │
│  Tìm theo từ khóa:      │              │  1. Gọi OpenAI API:          │
│  - "laptop"             │              │     text-embedding-3-small   │
│  - "sinh viên"          │              │     → Vector 1536 chiều      │
│  - "giá rẻ"             │              │                              │
│                         │              │  2. kNN search:              │
│  Kết quả:               │              │     Tìm các sản phẩm có     │
│  - Laptop Acer Aspire   │              │     text_vector gần nhất     │
│    (chứa "laptop")      │              │                              │
│  - Score: 8.5           │              │  Kết quả:                    │
│                         │              │  - Laptop Acer Aspire        │
│                         │              │    (ngữ nghĩa: máy tính     │
│                         │              │     phù hợp sinh viên)       │
│                         │              │  - MacBook Air M3            │
│                         │              │    (ngữ nghĩa: laptop mỏng  │
│                         │              │     nhẹ cho học tập)         │
│                         │              │  - Score: 0.87               │
└──────────┬──────────────┘              └──────────────┬───────────────┘
           │                                            │
           └────────────────┬───────────────────────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │  SCORE FUSION          │
               │                        │
               │  final_score =         │
               │    0.7 × BM25_score +  │
               │    0.3 × kNN_score     │
               │                        │
               │  Sắp xếp theo          │
               │  final_score giảm dần  │
               └────────────────────────┘
```

#### Tại sao cần Hybrid Search?

| Trường hợp | Chỉ BM25 (từ khóa) | Chỉ kNN (ngữ nghĩa) | Hybrid |
|------------|---------------------|----------------------|--------|
| Gõ chính xác tên sản phẩm: "iPhone 15" | ✅ Tốt | ⚠️ Có thể trả thêm sản phẩm không liên quan | ✅ Tốt nhất |
| Gõ theo ý định: "quà tặng bạn gái" | ❌ Không khớp từ khóa nào | ✅ Hiểu ngữ nghĩa | ✅ Tốt nhất |
| Gõ hỗn hợp: "tai nghe chống ồn dưới 2 triệu" | ⚠️ Chỉ khớp "tai nghe" | ✅ Hiểu cả ý định | ✅ Tốt nhất |

### 4.6. Visual Search (Tìm kiếm bằng hình ảnh)

> Chi tiết kỹ thuật được mô tả tại [Mục 9](#9-thiết-kế-visual-search-tìm-kiếm-bằng-hình-ảnh)

---

## 5. THIẾT KẾ ELASTICSEARCH INDEX

### 5.1. Index Mapping: `products`

```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "vietnamese_analyzer": {
          "type": "custom",
          "tokenizer": "icu_tokenizer",
          "filter": ["icu_folding", "lowercase"]
        },
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "icu_folding", "edge_ngram_filter"]
        },
        "autocomplete_search_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "icu_folding"]
        }
      },
      "filter": {
        "edge_ngram_filter": {
          "type": "edge_ngram",
          "min_gram": 1,
          "max_gram": 20
        }
      }
    }
  },
  "mappings": {
    "properties": {

      "id":              { "type": "keyword" },
      "name":            {
        "type": "text",
        "analyzer": "vietnamese_analyzer",
        "fields": {
          "raw":         { "type": "keyword" },
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete_analyzer",
            "search_analyzer": "autocomplete_search_analyzer"
          },
          "folded":      {
            "type": "text",
            "analyzer": "vietnamese_analyzer"
          }
        }
      },
      "slug":            { "type": "keyword" },
      "description":     {
        "type": "text",
        "analyzer": "vietnamese_analyzer"
      },

      "category_id":     { "type": "keyword" },
      "category_name":   {
        "type": "text",
        "analyzer": "vietnamese_analyzer",
        "fields": {
          "raw": { "type": "keyword" }
        }
      },
      "category_slug":   { "type": "keyword" },
      "parent_category_id": { "type": "keyword" },

      "price":           { "type": "double" },
      "original_price":  { "type": "double" },
      "has_discount":    { "type": "boolean" },
      "discount_percent": { "type": "integer" },

      "attributes":      {
        "type": "object",
        "properties": {
          "color":       { "type": "keyword" },
          "size":        { "type": "keyword" },
          "brand":       { "type": "keyword" }
        }
      },

      "stock_quantity":  { "type": "integer" },
      "is_active":       { "type": "boolean" },

      "image_url":       { "type": "keyword", "index": false },
      "images":          { "type": "keyword", "index": false },

      "created_at":      { "type": "date" },
      "updated_at":      { "type": "date" },

      "text_vector": {
        "type": "dense_vector",
        "dims": 1536,
        "index": true,
        "similarity": "cosine"
      },

      "image_vector": {
        "type": "dense_vector",
        "dims": 512,
        "index": true,
        "similarity": "cosine"
      },

      "suggest": {
        "type": "completion",
        "analyzer": "vietnamese_analyzer"
      }
    }
  }
}
```

### 5.2. Giải thích các trường Vector

| Trường | Kích thước | Mô hình AI | Mục đích |
|--------|-----------|-------------|----------|
| `text_vector` | 1536 chiều | OpenAI `text-embedding-3-small` | Hybrid Search — tìm theo ngữ nghĩa văn bản |
| `image_vector` | 512 chiều | OpenAI CLIP (`ViT-B/32`) | Visual Search — tìm theo ngoại quan hình ảnh |

### 5.3. Ví dụ Document trong Index

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Điện thoại Samsung Galaxy S24 Ultra",
  "slug": "dien-thoai-samsung-galaxy-s24-ultra",
  "description": "Điện thoại thông minh cao cấp với camera 200MP...",

  "category_id": "cat-uuid-001",
  "category_name": "Điện thoại",
  "category_slug": "dien-thoai",
  "parent_category_id": "cat-uuid-root",

  "price": 25990000,
  "original_price": 29990000,
  "has_discount": true,
  "discount_percent": 13,

  "attributes": {
    "color": "Đen",
    "brand": "Samsung"
  },

  "stock_quantity": 150,
  "is_active": true,

  "image_url": "https://cdn.vshop.com/products/galaxy-s24-ultra.jpg",
  "images": [
    "https://cdn.vshop.com/products/galaxy-s24-ultra.jpg",
    "https://cdn.vshop.com/products/galaxy-s24-ultra-2.jpg"
  ],

  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-09-20T14:30:00Z",

  "text_vector": [0.0123, -0.0456, 0.0789, ...],
  "image_vector": [0.234, -0.567, 0.891, ...],

  "suggest": {
    "input": [
      "Samsung Galaxy S24 Ultra",
      "Điện thoại Samsung",
      "Galaxy S24",
      "Samsung"
    ],
    "weight": 10
  }
}
```

---

## 6. THIẾT KẾ SEARCH SERVICE (BACKEND)

### 6.1. Cấu trúc thư mục

```
backend/search-service/
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env
├── .env.example
├── prisma/                        # Không cần — service này không dùng PostgreSQL trực tiếp
├── src/
│   ├── server.ts                  # Entry point
│   ├── app.ts                     # Express app setup
│   │
│   ├── config/
│   │   ├── env.ts                 # Biến môi trường
│   │   └── elasticsearch.ts       # Elasticsearch client singleton
│   │
│   ├── controllers/
│   │   ├── search.controller.ts   # Xử lý request tìm kiếm
│   │   └── visual.controller.ts   # Xử lý request visual search
│   │
│   ├── services/
│   │   ├── search.service.ts      # Logic tìm kiếm chính
│   │   ├── suggest.service.ts     # Logic autocomplete
│   │   ├── visual.service.ts      # Logic visual search
│   │   ├── embedding.service.ts   # Gọi OpenAI API sinh vector
│   │   └── indexer.service.ts     # Logic đồng bộ data vào ES
│   │
│   ├── elasticsearch/
│   │   ├── index-mapping.ts       # Định nghĩa mapping cho index
│   │   ├── query-builder.ts       # Xây dựng ES query động
│   │   └── setup.ts               # Tạo index khi khởi động
│   │
│   ├── rabbitmq/
│   │   └── consumer.ts            # Lắng nghe product.events
│   │
│   ├── routes/
│   │   ├── index.ts
│   │   ├── search.routes.ts       # /search/products, /search/suggest
│   │   └── visual.routes.ts       # /search/visual
│   │
│   ├── scripts/
│   │   └── reindex.ts             # Script đồng bộ toàn bộ từ PostgreSQL (chạy 1 lần)
│   │
│   ├── middlewares/
│   │   └── upload.middleware.ts   # Multer config cho upload ảnh
│   │
│   ├── types/
│   │   └── search.types.ts
│   │
│   └── utils/
│       ├── response.ts
│       └── text-normalizer.ts     # Chuẩn hóa Unicode, bỏ dấu
```

### 6.2. API Endpoints

#### 6.2.1. Autocomplete (Gợi ý từ khóa)

```
GET /search/suggest

Query Parameters:
  q       (string, bắt buộc)   Chuỗi ký tự người dùng đang gõ
  limit   (number, mặc định 5) Số gợi ý tối đa

Response: 200 OK
{
  "success": true,
  "data": {
    "keywords": [
      {
        "text": "iPhone 15 Pro Max",
        "highlight": "<em>iPh</em>one 15 Pro Max",
        "score": 9.2
      }
    ],
    "products": [
      {
        "id": "uuid-...",
        "name": "iPhone 15 Pro Max 256GB",
        "slug": "iphone-15-pro-max-256gb",
        "image_url": "https://...",
        "price": 27990000,
        "discounted_price": 25990000
      }
    ]
  }
}
```

#### 6.2.2. Tìm kiếm sản phẩm (Full-text + Hybrid + Facets)

```
GET /search/products

Query Parameters:
  q              (string)    Từ khóa tìm kiếm
  page           (number)    Trang hiện tại (mặc định 1)
  limit          (number)    Số sản phẩm/trang (mặc định 12, tối đa 100)
  category_id    (string)    Lọc theo danh mục
  price_min      (number)    Giá tối thiểu
  price_max      (number)    Giá tối đa
  color          (string)    Lọc theo màu sắc
  brand          (string)    Lọc theo thương hiệu
  has_discount   (boolean)   Chỉ hiện sản phẩm đang giảm giá
  sort           (string)    Sắp xếp: relevance | newest | price_asc | price_desc | sales
  mode           (string)    Chế độ: keyword | hybrid (mặc định hybrid)

Response: 200 OK
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-...",
        "name": "Samsung Galaxy S24 Ultra",
        "slug": "samsung-galaxy-s24-ultra",
        "description": "...",
        "category_name": "Điện thoại",
        "price": 25990000,
        "original_price": 29990000,
        "discount_percent": 13,
        "image_url": "https://...",
        "stock_quantity": 150,
        "score": 12.5,
        "highlight": {
          "name": ["<em>Samsung</em> <em>Galaxy</em> S24 Ultra"],
          "description": ["...camera 200MP <em>Samsung</em>..."]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 156,
      "totalPages": 13
    },
    "facets": {
      "categories": [
        { "key": "Điện thoại", "id": "cat-001", "count": 45 },
        { "key": "Phụ kiện", "id": "cat-002", "count": 23 }
      ],
      "price_ranges": [
        { "key": "Dưới 5 triệu", "from": 0, "to": 5000000, "count": 30 },
        { "key": "5 - 15 triệu", "from": 5000000, "to": 15000000, "count": 55 },
        { "key": "15 - 30 triệu", "from": 15000000, "to": 30000000, "count": 48 },
        { "key": "Trên 30 triệu", "from": 30000000, "count": 23 }
      ],
      "colors": [
        { "key": "Đen", "count": 28 },
        { "key": "Trắng", "count": 22 }
      ],
      "brands": [
        { "key": "Samsung", "count": 35 },
        { "key": "Apple", "count": 30 }
      ],
      "discount_count": 18
    }
  }
}
```

#### 6.2.3. Tìm kiếm bằng hình ảnh (Visual Search)

```
POST /search/visual

Content-Type: multipart/form-data

Body:
  image     (file, bắt buộc)   File ảnh (jpg/png/webp, tối đa 5MB)
  limit     (number)            Số kết quả tối đa (mặc định 12)

Response: 200 OK
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-...",
        "name": "Áo sơ mi trắng nam Slim Fit",
        "slug": "ao-so-mi-trang-nam-slim-fit",
        "image_url": "https://...",
        "price": 350000,
        "similarity_score": 0.92,
        "similarity_percent": 92
      }
    ],
    "processing_time_ms": 450
  }
}
```

### 6.3. Embedding Service — Gọi OpenAI API

#### 6.3.1. Text Embedding (cho Hybrid Search)

```
┌─────────────────────────────────────────────────────────┐
│                  embedding.service.ts                     │
│                                                          │
│  generateTextEmbedding(text: string): Promise<number[]>  │
│                                                          │
│  Input:  "Điện thoại Samsung Galaxy S24 Ultra"           │
│                                                          │
│  Gọi API:                                                │
│    POST https://api.openai.com/v1/embeddings             │
│    {                                                     │
│      model: "text-embedding-3-small",                    │
│      input: "Điện thoại Samsung Galaxy S24 Ultra"        │
│    }                                                     │
│                                                          │
│  Output: number[1536] — vector 1536 chiều                │
└─────────────────────────────────────────────────────────┘
```

#### 6.3.2. Image Embedding (cho Visual Search)

```
┌─────────────────────────────────────────────────────────┐
│                  embedding.service.ts                     │
│                                                          │
│  generateImageEmbedding(imageBuffer: Buffer):            │
│                                    Promise<number[]>     │
│                                                          │
│  Input:  Buffer của file ảnh                             │
│                                                          │
│  Gọi API:                                                │
│    POST https://api.openai.com/v1/embeddings             │
│    Hoặc dùng CLIP model qua API                          │
│    {                                                     │
│      model: "clip-vit-base-patch32",                     │
│      input: base64_encoded_image                         │
│    }                                                     │
│                                                          │
│  Output: number[512] — vector 512 chiều                  │
└─────────────────────────────────────────────────────────┘
```

> **Lưu ý:** OpenAI hiện chưa cung cấp trực tiếp CLIP API. Giải pháp thay thế:
> - **Phương án A (Khuyên dùng):** Dùng thư viện npm `@xenova/transformers` để chạy CLIP model (onnx) trực tiếp trong Node.js — không cần Python sidecar.
> - **Phương án B:** Dùng Hugging Face Inference API (miễn phí tầng thấp) với model `openai/clip-vit-base-patch32`.

---

## 7. CƠ CHẾ ĐỒNG BỘ DỮ LIỆU POSTGRESQL → ELASTICSEARCH

### 7.1. Tổng quan 2 cơ chế đồng bộ

| Cơ chế | Khi nào chạy | Mục đích |
|--------|-------------|----------|
| **Event-driven (Realtime)** | Mỗi khi Admin tạo/sửa/xóa sản phẩm | Cập nhật tức thời (< 1 giây) |
| **Full Reindex (Batch)** | Lần đầu triển khai hoặc khi cần rebuild | Đồng bộ toàn bộ dữ liệu |

### 7.2. Event-driven Sync (Thời gian thực qua RabbitMQ)

#### Bước 1: Catalog Service phát sự kiện (Publisher)

Tại file `catalog-service/src/services/product.service.ts`, bỏ comment các dòng `publishProductEvent` đã có sẵn và bổ sung:

```
Khi create() thành công → publishProductEvent('product.created', product)
Khi update() thành công → publishProductEvent('product.updated', product)
Khi remove() thành công → publishProductEvent('product.deleted', { id })
```

#### Bước 2: Search Service lắng nghe (Consumer)

```
┌─────────────────────────────────────────────────────────────┐
│              search-service/src/rabbitmq/consumer.ts          │
│                                                              │
│  Kết nối → RabbitMQ                                          │
│  Bind queue → Exchange: product.events                       │
│  Routing keys: product.created, product.updated,             │
│                product.deleted                               │
│                                                              │
│  Xử lý message:                                             │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ product.created / product.updated:                     │   │
│  │   1. Parse product data từ message                     │   │
│  │   2. Gọi OpenAI → sinh text_vector (từ name + desc)   │   │
│  │   3. Gọi CLIP → sinh image_vector (từ primary image)  │   │
│  │   4. Map sang ES document format                       │   │
│  │   5. Upsert vào Elasticsearch index                    │   │
│  │   6. ACK message                                       │   │
│  ├───────────────────────────────────────────────────────┤   │
│  │ product.deleted:                                       │   │
│  │   1. Parse product ID                                  │   │
│  │   2. Delete document từ Elasticsearch                  │   │
│  │   3. ACK message                                       │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 7.3. Full Reindex Script (Chạy 1 lần hoặc khi cần rebuild)

```
┌─────────────────────────────────────────────────────────────┐
│              search-service/src/scripts/reindex.ts            │
│                                                              │
│  1. Kết nối PostgreSQL (catalog_db) — readonly               │
│  2. Xóa index cũ (nếu có) → Tạo index mới với mapping      │
│  3. Query toàn bộ products từ PostgreSQL (batch 100 records) │
│  4. Với mỗi batch:                                           │
│     a. Gọi OpenAI API sinh text_vector (batch embedding)     │
│     b. Gọi CLIP sinh image_vector cho ảnh chính              │
│     c. Bulk insert vào Elasticsearch                         │
│  5. Log tiến trình: [100/5000] [500/5000] ... [5000/5000]    │
│  6. Verify: so sánh count PostgreSQL vs Elasticsearch        │
│                                                              │
│  Chạy: npx ts-node src/scripts/reindex.ts                   │
│  Hoặc: npm run reindex                                       │
└─────────────────────────────────────────────────────────────┘
```

### 7.4. Sơ đồ luồng đồng bộ toàn diện

```
                    ┌──────────────────────┐
                    │   Admin Dashboard    │
                    │   (Tạo/Sửa/Xóa SP)  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Catalog Service    │
                    │   (:3002)            │
                    │                      │
                    │  1. Ghi PostgreSQL    │──────► PostgreSQL
                    │  2. Publish event    │        (Source of Truth)
                    └──────────┬───────────┘
                               │
                     RabbitMQ  │  product.events
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Search Service     │
                    │   (:3008)            │
                    │                      │
                    │  3. Consumer nhận    │
                    │  4. Sinh Embedding   │──────► OpenAI API
                    │  5. Ghi ES index    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Elasticsearch      │
                    │   (:9200)            │
                    │                      │
                    │   Index: products    │
                    │   - text fields      │
                    │   - text_vector      │
                    │   - image_vector     │
                    └──────────────────────┘
```

---

## 8. THIẾT KẾ FRONTEND (SEARCH UI)

### 8.1. Thay đổi trên Header.tsx — Thanh tìm kiếm thông minh

#### Trước (Hiện tại)

```
┌──────────────────────────────────────────────────────────┐
│  🔍  [Tìm kiếm sản phẩm, thương hiệu...         ] [Tìm]│
│                                                          │
│  (Khi focus → chỉ hiện static "Tìm kiếm phổ biến")      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Tìm kiếm phổ biến                                 │  │
│  │  [iPhone 15 Pro Max] [MacBook Air M3] [Giày thể..] │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

#### Sau (Nâng cấp)

```
┌──────────────────────────────────────────────────────────┐
│  🔍  [ip                                    ] [📷] [Tìm] │
│                                                          │
│  (Khi gõ → gợi ý realtime từ Elasticsearch)              │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │  💡 Từ khóa gợi ý                                   │  │
│  │  ├── iPhone 15 Pro Max                              │  │
│  │  ├── iPhone 14 Plus                                 │  │
│  │  └── iPad Air M2                                    │  │
│  │                                                     │  │
│  │  📦 Sản phẩm gợi ý                                  │  │
│  │  ┌──────┬──────────────────────────────────────┐    │  │
│  │  │ [📱] │ iPhone 15 Pro Max 256GB               │    │  │
│  │  │      │ ₫27.990.000  ₫29.990.000  -7%        │    │  │
│  │  ├──────┼──────────────────────────────────────┤    │  │
│  │  │ [📱] │ iPhone 14 Plus 128GB                  │    │  │
│  │  │      │ ₫19.990.000                           │    │  │
│  │  └──────┴──────────────────────────────────────┘    │  │
│  │                                                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [📷] = Nút Visual Search → Mở modal upload/chụp ảnh    │
└──────────────────────────────────────────────────────────┘
```

### 8.2. Thay đổi trên ProductList.tsx — Bộ lọc thông minh

#### Trước (Sidebar cố định)

```
┌──────────┐ ┌──────────────────────────────────────────┐
│ Bộ lọc   │ │                                          │
│          │ │  [Phổ biến] [Mới nhất] [Bán chạy] [Giá▼]│
│ Danh mục │ │                                          │
│ ○ Tất cả │ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ ○ Điện.. │ │  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │   │
│ ○ Thời.. │ │  └──────┘ └──────┘ └──────┘ └──────┘   │
│          │ │                                          │
│ Khuyến mãi│ │                                          │
│ ☐ Giảm giá│ │                                          │
└──────────┘ └──────────────────────────────────────────┘
```

#### Sau (Sidebar thông minh + Dynamic Facets)

```
┌──────────────┐ ┌──────────────────────────────────────────┐
│ Bộ lọc       │ │                                          │
│              │ │  Kết quả cho "Samsung" (156 sản phẩm)    │
│ Danh mục     │ │  [Phổ biến] [Mới nhất] [Bán chạy] [Giá▼]│
│ ○ Tất cả     │ │                                          │
│ ○ Đ.thoại(45)│ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│ ○ Tablet (23)│ │  │ SP 1 │ │ SP 2 │ │ SP 3 │ │ SP 4 │   │
│ ○ P.kiện(12) │ │  │ ⭐4.8│ │ ⭐4.5│ │ ⭐4.9│ │ ⭐4.2│   │
│              │ │  │ 25tr │ │ 12tr │ │ 8tr  │ │ 3tr  │   │
│ Khoảng giá   │ │  │ -13% │ │      │ │ -5%  │ │      │   │
│ ○ < 5 tr (30)│ │  └──────┘ └──────┘ └──────┘ └──────┘   │
│ ○ 5-15tr (55)│ │                                          │
│ ○ 15-30tr(48)│ │  Highlighting: kết quả được tô đậm      │
│ ○ > 30tr (23)│ │  từ khóa khớp trong tên/mô tả SP        │
│              │ │                                          │
│ Màu sắc      │ │                                          │
│ ☐ Đen   (28) │ │                                          │
│ ☐ Trắng (22) │ │                                          │
│ ☐ Xanh  (15) │ │                                          │
│              │ │                                          │
│ Thương hiệu  │ │                                          │
│ ☐ Samsung(35)│ │                                          │
│ ☐ Apple  (30)│ │                                          │
│              │ │                                          │
│ Khuyến mãi   │ │                                          │
│ ☐ Giảm giá(18)│ │                                          │
└──────────────┘ └──────────────────────────────────────────┘

Các con số (45), (23), (28),... = Dynamic Facet Counts
Được tính toán bởi Elasticsearch Aggregations
Cập nhật tự động khi người dùng thay đổi bộ lọc
```

### 8.3. Thay đổi Frontend Service Layer

#### File mới: `frontend/src/services/searchService.ts`

```
searchService.ts

├── searchSuggest(query: string, limit?: number)
│   → GET /api/search/suggest?q=...&limit=...
│   → Trả về: { keywords[], products[] }
│
├── searchProducts(params: SearchProductsQuery)
│   → GET /api/search/products?q=...&filters=...
│   → Trả về: { items[], pagination, facets }
│
└── visualSearch(imageFile: File, limit?: number)
    → POST /api/search/visual (multipart/form-data)
    → Trả về: { items[] (with similarity_score) }
```

#### File sửa: `frontend/src/services/productService.ts`

```
productService.ts

└── getProducts()
    → Giữ nguyên để phục vụ Admin Dashboard (CRUD)
    → Trang user ProductList.tsx chuyển sang dùng searchService.searchProducts()
```

### 8.4. Custom Hook: `useSearch`

```
frontend/src/hooks/useSearch.ts

useSearch(initialQuery?)
├── State:
│   ├── query: string
│   ├── suggestions: { keywords[], products[] }
│   ├── results: { items[], pagination, facets }
│   ├── filters: { category_id?, price_min?, price_max?, color?, brand?, has_discount? }
│   ├── isLoading: boolean
│   └── searchMode: 'keyword' | 'hybrid'
│
├── Effects:
│   ├── Debounce query (150ms) → gọi searchSuggest()
│   └── Khi submit / filter thay đổi → gọi searchProducts()
│
└── Actions:
    ├── setQuery(text)
    ├── submitSearch()
    ├── setFilter(key, value)
    ├── clearFilters()
    └── setPage(number)
```

---

## 9. THIẾT KẾ VISUAL SEARCH (TÌM KIẾM BẰNG HÌNH ẢNH)

### 9.1. Luồng hoạt động chi tiết

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                       │
│                                                                       │
│  Bước 1: Người dùng nhấn nút [📷] trên SearchBar                     │
│          │                                                            │
│          ▼                                                            │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │              VISUAL SEARCH MODAL                           │       │
│  │                                                            │       │
│  │  ┌────────────────────┐  ┌────────────────────┐           │       │
│  │  │                    │  │                    │           │       │
│  │  │   📁 Tải ảnh lên   │  │   📷 Chụp ảnh      │           │       │
│  │  │   từ thiết bị      │  │   từ camera        │           │       │
│  │  │                    │  │                    │           │       │
│  │  └────────────────────┘  └────────────────────┘           │       │
│  │                                                            │       │
│  │  Kéo thả ảnh vào đây hoặc nhấn để chọn file               │       │
│  │  Hỗ trợ: JPG, PNG, WebP (tối đa 5MB)                      │       │
│  │                                                            │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                       │
│  Bước 2: Sau khi chọn/chụp ảnh                                       │
│          │                                                            │
│          ▼                                                            │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │  ┌──────────┐                                              │       │
│  │  │          │  Đang phân tích hình ảnh...                  │       │
│  │  │  [Ảnh    │  ████████████░░░░░░ 65%                      │       │
│  │  │  Preview]│                                              │       │
│  │  │          │                                              │       │
│  │  └──────────┘                                              │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                       │
│  Bước 3: Hiển thị kết quả                                            │
│          │                                                            │
│          ▼                                                            │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │  Tìm kiếm bằng ảnh — 8 sản phẩm tương tự                 │       │
│  │                                                            │       │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                     │       │
│  │  │[Ảnh] │ │[Ảnh] │ │[Ảnh] │ │[Ảnh] │                     │       │
│  │  │92%   │ │88%   │ │85%   │ │81%   │ ← Similarity %      │       │
│  │  │Áo sơ │ │Áo sơ │ │Áo sơ │ │Áo    │                     │       │
│  │  │mi    │ │mi    │ │mi    │ │khoác │                     │       │
│  │  │350k  │ │420k  │ │290k  │ │550k  │                     │       │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                     │       │
│  └────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────┘
```

### 9.2. Luồng kỹ thuật phía Backend

```
[Frontend]
  │ POST /api/search/visual
  │ Content-Type: multipart/form-data
  │ Body: image=<file.jpg>
  ▼
[Search Service — visual.controller.ts]
  │
  │ 1. Multer middleware nhận file ảnh
  │ 2. Validate: kiểm tra định dạng (jpg/png/webp), kích thước (≤ 5MB)
  │ 3. Resize ảnh về 224x224 px (chuẩn đầu vào CLIP)
  │
  ▼
[embedding.service.ts — generateImageEmbedding()]
  │
  │ 4. Chạy CLIP model (ViT-B/32) qua @xenova/transformers
  │    hoặc gọi Hugging Face Inference API
  │    Input:  Buffer ảnh 224x224
  │    Output: Float32Array[512] — image vector
  │
  ▼
[search.service.ts — visualSearch()]
  │
  │ 5. Xây dựng Elasticsearch kNN query:
  │    {
  │      knn: {
  │        field: "image_vector",
  │        query_vector: [0.234, -0.567, ...],  ← vector từ bước 4
  │        k: 12,
  │        num_candidates: 100
  │      },
  │      _source: ["id", "name", "slug", "price", "image_url", ...]
  │    }
  │
  ▼
[Elasticsearch]
  │
  │ 6. Tính cosine similarity giữa query vector
  │    và image_vector của tất cả documents
  │ 7. Trả về top-k documents có similarity cao nhất
  │    (Thời gian xử lý: < 50ms)
  │
  ▼
[Search Service]
  │
  │ 8. Map kết quả:
  │    - Chuyển _score thành similarity_percent (0-100%)
  │    - Lọc bỏ kết quả có score < 0.5 (không đủ giống)
  │    - Sắp xếp giảm dần theo similarity
  │
  ▼
[Frontend]
     Hiển thị grid sản phẩm + % tương đồng
```

### 9.3. Cách sinh Image Embedding cho sản phẩm trong kho

Khi sản phẩm được tạo/cập nhật, Search Service sẽ tự động sinh image vector:

```
Catalog Service publish event: product.created
           │
           ▼
Search Service Consumer nhận event
           │
           │ product data chứa images[]:
           │   images[0].url = "https://cdn.vshop.com/products/ao-somi.jpg"
           │
           ▼
embedding.service.ts:
  1. Download ảnh từ URL (images[0] — ảnh is_primary)
  2. Resize về 224x224
  3. Chạy qua CLIP model → vector[512]
  4. Trả về image_vector
           │
           ▼
indexer.service.ts:
  Ghi document vào Elasticsearch với trường:
    image_vector: [0.234, -0.567, 0.891, ...]
```

---

## 10. THAY ĐỔI HẠ TẦNG DOCKER

### 10.1. Thêm vào `docker-compose.yml`

Chỉ cần thêm **2 service mới** vào file `docker-compose.yml` hiện tại. Không sửa bất kỳ service nào đang có:

```yaml
# === THÊM MỚI ===

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.15.0
    container_name: san_thuong_mai_elasticsearch
    restart: always
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - xpack.security.http.ssl.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    volumes:
      - esdata:/var/lib/elasticsearch/data

  search-service:
    build:
      context: ./backend/search-service
    container_name: san_thuong_mai_search_service
    restart: always
    ports:
      - "3008:3008"
    env_file:
      - ./backend/search-service/.env
    environment:
      ELASTICSEARCH_URL: http://elasticsearch:9200
      RABBITMQ_URL: "amqp://guest:guest@rabbitmq:5672"
      CATALOG_DB_URL: "postgresql://admin:1234567@postgres:5432/catalog_db"
      OPENAI_API_KEY: "${OPENAI_API_KEY}"
    depends_on:
      - elasticsearch
      - rabbitmq
      - postgres

# === THÊM VOLUME ===
volumes:
  pgdata:
  rabbitmq_data:
  esdata:          # THÊM MỚI
```

### 10.2. Thêm vào API Gateway

Cập nhật `api-gateway/.env`:

```
SEARCH_SERVICE_URL=http://search-service:3008
```

Cập nhật `api-gateway/src/routes.ts` — thêm 1 dòng proxy:

```
// Search service — public (ai cũng có thể tìm kiếm)
router.use("/search", createProxyMiddleware(proxyOptions(env.SEARCH_SERVICE_URL)));
```

### 10.3. Tổng quan thay đổi hạ tầng

```
                    TRƯỚC                           SAU
          ┌───────────────────┐           ┌───────────────────┐
          │ PostgreSQL        │           │ PostgreSQL        │ (Không đổi)
          │ RabbitMQ          │           │ RabbitMQ          │ (Không đổi)
          │ API Gateway       │           │ API Gateway       │ (Thêm 1 proxy route)
          │ 7 Services        │           │ 7 Services        │ (catalog: bỏ comment publish)
          │                   │           │ + Elasticsearch   │ ← THÊM MỚI
          │                   │           │ + Search Service  │ ← THÊM MỚI
          └───────────────────┘           └───────────────────┘

Tổng thay đổi trên hệ thống hiện có:
  ✅ PostgreSQL:     Không thay đổi
  ✅ RabbitMQ:       Không thay đổi (đã có exchange product.events)
  ✅ 6 services:     Không thay đổi (identity, cart, order, payment, notification, recommendation)
  ⚡ Catalog:        Thay đổi nhỏ (bỏ comment 3 dòng publishProductEvent)
  ⚡ API Gateway:    Thay đổi nhỏ (thêm 1 dòng proxy route + 1 biến env)
  🆕 Elasticsearch:  Container mới
  🆕 Search Service: Microservice mới
```

---

## 11. KẾ HOẠCH TRIỂN KHAI THEO GIAI ĐOẠN

### Giai đoạn 1: Nền tảng (Full-text + Fuzzy + Autocomplete)

**Thời gian ước tính: 3-5 ngày**

```
Bước 1.1 — Hạ tầng
  ☐ Thêm Elasticsearch container vào docker-compose.yml
  ☐ Tạo project search-service (scaffold)
  ☐ Cấu hình Elasticsearch client + tạo index mapping
  ☐ Kiểm tra kết nối ES từ search-service

Bước 1.2 — Đồng bộ dữ liệu
  ☐ Bỏ comment publishProductEvent trong catalog-service
  ☐ Viết RabbitMQ consumer trong search-service
  ☐ Viết indexer.service.ts (map PostgreSQL data → ES document)
  ☐ Viết script reindex.ts (full sync lần đầu)
  ☐ Chạy reindex → verify data trong ES

Bước 1.3 — API tìm kiếm cơ bản
  ☐ Viết search.service.ts (full-text + fuzzy query)
  ☐ Viết suggest.service.ts (autocomplete query)
  ☐ Viết search.controller.ts + routes
  ☐ Thêm proxy route trong API Gateway
  ☐ Test API bằng Postman/curl

Bước 1.4 — Frontend cơ bản
  ☐ Tạo searchService.ts (frontend)
  ☐ Tạo useSearch hook
  ☐ Nâng cấp Header.tsx — Autocomplete dropdown thời gian thực
  ☐ Cập nhật ProductList.tsx — chuyển sang dùng search API
  ☐ Test end-to-end: gõ tiếng Việt không dấu, lỗi chính tả
```

### Giai đoạn 2: Bộ lọc thông minh (Faceted Search)

**Thời gian ước tính: 2-3 ngày**

```
Bước 2.1 — Backend
  ☐ Bổ sung Aggregations vào search query
  ☐ Thêm filter params vào API (price_min, price_max, color, brand)
  ☐ Trả facet counts trong response

Bước 2.2 — Frontend
  ☐ Nâng cấp sidebar ProductList.tsx — dynamic facets
  ☐ Thêm bộ lọc khoảng giá (range slider hoặc radio)
  ☐ Thêm bộ lọc màu sắc, thương hiệu (checkbox + count)
  ☐ Hiển thị số lượng sản phẩm bên cạnh mỗi filter option
  ☐ Test: lọc kết hợp nhiều điều kiện
```

### Giai đoạn 3: Hybrid Search (Tìm kiếm ngữ nghĩa)

**Thời gian ước tính: 2-3 ngày**

```
Bước 3.1 — Embedding Pipeline
  ☐ Tạo embedding.service.ts — tích hợp OpenAI text-embedding-3-small
  ☐ Cập nhật indexer: sinh text_vector khi index sản phẩm
  ☐ Cập nhật reindex script: sinh vector cho toàn bộ sản phẩm
  ☐ Chạy reindex với text vectors

Bước 3.2 — Hybrid Query
  ☐ Xây dựng hybrid query: BM25 + kNN (score fusion)
  ☐ Thêm param mode=hybrid vào API
  ☐ Tinh chỉnh trọng số BM25/kNN (mặc định 0.7/0.3)

Bước 3.3 — Test & Tinh chỉnh
  ☐ Test case: "quà tặng bạn gái" → kết quả có ngữ nghĩa
  ☐ Test case: "máy tính học tập giá rẻ" → kết quả hợp lý
  ☐ So sánh kết quả hybrid vs keyword-only
```

### Giai đoạn 4: Visual Search (Tìm kiếm bằng hình ảnh)

**Thời gian ước tính: 3-4 ngày**

```
Bước 4.1 — Image Embedding Pipeline
  ☐ Tích hợp CLIP model (@xenova/transformers hoặc HuggingFace API)
  ☐ Cập nhật indexer: sinh image_vector từ ảnh sản phẩm
  ☐ Chạy reindex với image vectors

Bước 4.2 — Visual Search API
  ☐ Cấu hình Multer middleware (upload ảnh)
  ☐ Viết visual.service.ts (nhận ảnh → CLIP → kNN query)
  ☐ Viết visual.controller.ts + routes
  ☐ Test API bằng Postman (upload ảnh → nhận kết quả)

Bước 4.3 — Frontend Visual Search UI
  ☐ Tạo component VisualSearchModal
  ☐ Hỗ trợ: kéo thả ảnh, chọn file, chụp camera (mobile)
  ☐ Hiển thị preview ảnh + loading state
  ☐ Hiển thị grid kết quả + % similarity
  ☐ Thêm nút [📷] trên SearchBar (Header.tsx)
  ☐ Test end-to-end trên desktop & mobile
```

---

## 12. RỦI RO & GIẢI PHÁP

### 12.1. Rủi ro kỹ thuật

| # | Rủi ro | Mức độ | Giải pháp |
|---|--------|--------|-----------|
| 1 | **Elasticsearch chiếm nhiều RAM** | Trung bình | Cấu hình `-Xms512m -Xmx512m` cho dev. Production tối thiểu 2GB. |
| 2 | **Dữ liệu ES và PostgreSQL lệch nhau** | Cao | RabbitMQ đảm bảo at-least-once delivery. Thêm cron job so sánh count định kỳ. Script reindex để fix nếu lệch. |
| 3 | **OpenAI API bị rate limit / downtime** | Trung bình | Queue retry mechanism trong consumer. Cache embedding đã sinh. Fallback về BM25-only nếu embedding fail. |
| 4 | **Chi phí OpenAI API** | Thấp | `text-embedding-3-small` rất rẻ (~$0.02/1M tokens). Chỉ gọi khi tạo/sửa sản phẩm, không gọi mỗi lần tìm kiếm. CLIP chạy local miễn phí. |
| 5 | **CLIP model nặng trên Node.js** | Trung bình | Dùng `@xenova/transformers` chạy ONNX runtime (không cần Python/GPU). Hoặc gọi HuggingFace API. |

### 12.2. Rủi ro vận hành

| # | Rủi ro | Giải pháp |
|---|--------|-----------|
| 1 | ES index bị hỏng / mất data | Chạy lại script `npm run reindex` — toàn bộ dữ liệu gốc vẫn an toàn trong PostgreSQL |
| 2 | Search Service bị lỗi / crash | Trang ProductList fallback về gọi Catalog Service (API cũ vẫn hoạt động) |
| 3 | Elasticsearch container bị kill | Dữ liệu được persist qua Docker volume `esdata`. Container restart tự phục hồi. |

### 12.3. Chiến lược Fallback

```
Frontend gọi Search API
       │
       ├── ✅ Success → Hiển thị kết quả từ Elasticsearch
       │
       └── ❌ Lỗi (timeout / 500 / network error)
              │
              ▼
       Fallback → Gọi Catalog Service API cũ (getProducts)
              │    (Vẫn hoạt động bình thường với Prisma ILIKE)
              ▼
       Hiển thị kết quả từ PostgreSQL (chất lượng thấp hơn nhưng vẫn work)
```

---

## PHỤ LỤC

### A. Biến môi trường cần cấu hình

```env
# search-service/.env
PORT=3008
NODE_ENV=development

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=products

# RabbitMQ (nhận events từ catalog-service)
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# PostgreSQL (readonly — chỉ dùng cho script reindex)
CATALOG_DB_URL=postgresql://admin:1234567@localhost:5432/catalog_db

# OpenAI API (cho text embedding)
OPENAI_API_KEY=sk-...

# Image Embedding
IMAGE_EMBEDDING_PROVIDER=xenova    # xenova | huggingface
HUGGINGFACE_API_KEY=hf_...         # Chỉ cần nếu provider = huggingface
```

### B. Thư viện npm cần cài cho search-service

```json
{
  "dependencies": {
    "express": "^4.18",
    "@elastic/elasticsearch": "^8.15",
    "amqplib": "^0.10",
    "openai": "^4.x",
    "@xenova/transformers": "^2.x",
    "multer": "^1.4",
    "sharp": "^0.33",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/express": "^4.x",
    "@types/amqplib": "^0.10",
    "@types/multer": "^1.x",
    "ts-node": "^10.x"
  }
}
```

### C. Ước tính tài nguyên phần cứng bổ sung

| Thành phần | RAM | CPU | Disk |
|-----------|-----|-----|------|
| Elasticsearch (dev) | 512MB - 1GB | 1 core | 500MB+ |
| Search Service | 256MB - 512MB | 0.5 core | 100MB |
| CLIP model (ONNX) | ~300MB | 0.5 core (lúc inference) | 400MB (model file) |
| **Tổng cộng thêm** | **~1 - 2GB RAM** | **~2 cores** | **~1GB** |

---

> **Ghi chú:** Tài liệu này mô tả thiết kế kỹ thuật chi tiết cho việc nâng cấp hệ thống tìm kiếm. PostgreSQL hiện tại **KHÔNG CẦN** thay đổi schema hay cấu trúc. Toàn bộ logic tìm kiếm mới được xử lý bởi Search Service + Elasticsearch — hoạt động hoàn toàn độc lập với các microservice hiện có.
