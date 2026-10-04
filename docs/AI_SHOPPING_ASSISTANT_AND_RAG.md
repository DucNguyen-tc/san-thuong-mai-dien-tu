# TÀI LIỆU THIẾT KẾ KỸ THUẬT: TRỢ LÝ MUA SẮM THÔNG MINH & HỆ THỐNG RAG

---

## MỤC LỤC
1. [Tổng quan Kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Thiết kế Cơ sở Dữ liệu](#2-thiết-kế-cơ-sở-dữ-liệu)
3. [Trợ lý Mua sắm AI — Tool Calling](#3-trợ-lý-mua-sắm-ai--tool-calling)
4. [Hệ thống RAG cho Knowledge Base](#4-hệ-thống-rag-cho-knowledge-base)
5. [Trải nghiệm Người dùng & Giao diện](#5-trải-nghiệm-người-dùng--giao-diện)
6. [Cơ chế An toàn & Xác thực Ngữ cảnh](#6-cơ-chế-an-toàn--xác-thực-ngữ-cảnh)
7. [Lộ trình Triển khai](#7-lộ-trình-triển-khai)
8. [Kết quả Đạt được](#8-kết-quả-đạt-được)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1. Vị trí trong Hệ sinh thái Microservices

Hệ thống hiện tại gồm 7 Microservice độc lập:
- `identity-service` (Port 3001) — Xác thực & Quản lý người dùng
- `catalog-service` (Port 3002) — Sản phẩm, Danh mục, Khuyến mãi, Tồn kho
- `cart-service` (Port 3003) — Giỏ hàng
- `order-service` (Port 3004) — Đơn hàng & Saga Pattern
- `payment-service` (Port 3005) — Thanh toán VNPay/MoMo
- `notification-service` (Port 3006) — Thông báo Email qua RabbitMQ
- `recommendation-service` (Port 3007) — Gợi ý sản phẩm (pgvector + TF-IDF)

**Đề xuất:** Tạo thêm một service mới là **`ai-service` (Port 3008)** đóng vai trò làm **bộ não AI trung tâm**, chịu trách nhiệm:
- Nhận tin nhắn Chat từ Frontend.
- Gọi LLM Provider (OpenAI / Gemini / Anthropic) để xử lý ngôn ngữ tự nhiên.
- Thực thi Tool Calling bằng cách gọi Internal API sang các service hiện có.
- Truy vấn RAG Knowledge Base để trả lời câu hỏi chính sách.

### 1.2. Luồng Dữ liệu Tổng thể (Data Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                             │
│                                                                     │
│   ┌──────────────┐                                                  │
│   │  Chat Widget │ ─── POST /api/ai/chat ──────────────────┐       │
│   │  (Floating)  │ <── SSE (Server-Sent Events) ───────────┤       │
│   └──────────────┘                                         │       │
└────────────────────────────────────────────────────────────│───────┘
                                                             │
                        ┌────────────────────┐               │
                        │   API Gateway      │───────────────┤
                        │   (Port 3000)      │               │
                        │   verifyToken()    │               │
                        └────────────────────┘               │
                                                             ▼
                        ┌────────────────────────────────────────────┐
                        │         AI SERVICE (Port 3008)             │
                        │                                            │
                        │  ┌─────────────┐   ┌──────────────────┐   │
                        │  │ Chat Router  │   │ RAG Engine       │   │
                        │  │ & Controller │   │ (Vector Search)  │   │
                        │  └──────┬───────┘   └────────┬─────────┘   │
                        │         │                    │             │
                        │  ┌──────▼────────────────────▼──────────┐ │
                        │  │     LLM Orchestrator                  │ │
                        │  │  (OpenAI / Gemini API + Tool Calling) │ │
                        │  └──────┬────────────────────────────────┘ │
                        │         │                                  │
                        │  ┌──────▼──────────┐                      │
                        │  │  Tool Executor  │                      │
                        │  │  (Internal API  │                      │
                        │  │   Caller)       │                      │
                        │  └──────┬──────────┘                      │
                        │         │                                  │
                        │    ai_db (PostgreSQL + pgvector)           │
                        └─────────┼──────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────────┐
              │                   │                       │
              ▼                   ▼                       ▼
     ┌────────────────┐  ┌───────────────┐  ┌────────────────────┐
     │ catalog-service│  │ cart-service   │  │ order-service      │
     │ (Tìm SP, Giá, │  │ (Thêm/Xóa/   │  │ (Tra cứu, Hủy     │
     │  Khuyến mãi)   │  │  Sửa Giỏ)     │  │  đơn hàng)         │
     └────────────────┘  └───────────────┘  └────────────────────┘
```

### 1.3. Tác động đến Hệ thống Hiện tại

| Thành phần | Mức độ thay đổi | Chi tiết |
|---|---|---|
| `catalog-service` | **Không thay đổi** | AI gọi API hiện có (`GET /api/catalog/products`, `POST /api/catalog/variants/bulk`) |
| `cart-service` | **Không thay đổi** | AI gọi API hiện có (`POST /api/cart/items`, `PUT /api/cart/items/:id`, `DELETE /api/cart/items/:id`) |
| `order-service` | **Không thay đổi** | AI gọi API hiện có (`GET /api/orders`, `PUT /api/orders/:id/cancel`) |
| `api-gateway` | **Thay đổi nhẹ** | Bổ sung route proxy `/ai` → `ai-service:3008`. Thêm biến `AI_SERVICE_URL` vào `env.ts` |
| `docker-compose.yml` | **Thay đổi nhẹ** | Thêm container `ai-service` (Port 3008) và database `ai_db` |
| `database/init.sql` | **Thay đổi nhẹ** | Thêm 1 dòng: `CREATE DATABASE ai_db;` |
| Các Database hiện tại | **KHÔNG thay đổi** | Toàn bộ schema của `identity_db`, `catalog_db`, `cart_db`, `order_db`, `payment_db`, `notification_db`, `recommendation_db` giữ nguyên 100% |

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU

### 2.1. Nguyên tắc: Tách biệt hoàn toàn

Tạo Database mới `ai_db` hoàn toàn độc lập. Nếu sau này muốn tắt tính năng AI, chỉ cần xóa container `ai-service` và database `ai_db`, hệ thống cốt lõi không bị ảnh hưởng.

### 2.2. Schema của `ai_db`

#### Bảng `chat_sessions` — Quản lý phiên hội thoại

```sql
CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID,                          -- NULL nếu là khách vãng lai (Guest)
    session_token   VARCHAR(255) UNIQUE NOT NULL,   -- Token định danh phiên (cho cả Guest)
    title           VARCHAR(255),                   -- Tiêu đề phiên chat (tự tạo bởi AI)
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_customer ON chat_sessions(customer_id);
```

| Cột | Mô tả |
|---|---|
| `customer_id` | UUID của khách hàng (lấy từ JWT). `NULL` nếu khách vãng lai — lúc đó AI chỉ hỗ trợ tư vấn/tra cứu chính sách, không thao tác giỏ hàng/đơn hàng. |
| `session_token` | Mã định danh phiên duy nhất. Dùng cho cả Guest (lưu vào LocalStorage) và User đã đăng nhập. |
| `title` | Tiêu đề tóm tắt phiên chat (AI tự sinh sau 2-3 lượt hội thoại đầu). |

#### Bảng `chat_messages` — Lịch sử tin nhắn

```sql
CREATE TABLE chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,           -- 'user', 'assistant', 'tool'
    content         TEXT,                            -- Nội dung text của tin nhắn
    tool_calls      JSONB,                           -- Mảng các tool call AI yêu cầu (nếu có)
    tool_call_id    VARCHAR(100),                    -- ID của tool call (nếu role = 'tool')
    metadata        JSONB,                           -- Dữ liệu bổ sung (Product Cards, Bảng so sánh...)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
```

| Cột | Mô tả |
|---|---|
| `role` | `user` = tin nhắn từ khách hàng. `assistant` = phản hồi từ AI. `tool` = kết quả trả về của Tool Calling. |
| `tool_calls` | Lưu trữ danh sách Tool mà AI quyết định gọi (ví dụ: `[{"name": "search_products", "arguments": {"query": "laptop sinh viên", "max_price": 15000000}}]`). |
| `metadata` | Dữ liệu cấu trúc JSON đi kèm (Product Cards, Bảng so sánh, Link giỏ hàng...) để Frontend render UI tương tác. |

#### Bảng `knowledge_documents` — Tài liệu gốc (chính sách, FAQ)

```sql
CREATE TABLE knowledge_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,           -- "Chính sách đổi trả hàng"
    source_type     VARCHAR(50) NOT NULL,            -- 'POLICY', 'FAQ', 'SHIPPING', 'WARRANTY'
    original_content TEXT NOT NULL,                   -- Nội dung gốc toàn văn
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### Bảng `document_chunks` — Đoạn văn bản đã chia nhỏ + Vector Embedding

```sql
-- Kích hoạt pgvector extension (đã có sẵn trong image pgvector/pgvector:pg16)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
    id              BIGSERIAL PRIMARY KEY,
    document_id     UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index     INT NOT NULL,                    -- Thứ tự đoạn trong tài liệu gốc
    content         TEXT NOT NULL,                    -- Nội dung đoạn văn bản (200-500 từ)
    embedding       vector(1536),                    -- Vector Embedding (OpenAI text-embedding-3-small = 1536 chiều)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

| Cột | Mô tả |
|---|---|
| `chunk_index` | Vị trí thứ tự đoạn trong tài liệu gốc, giúp ghép lại ngữ cảnh liền mạch khi trích dẫn. |
| `content` | Đoạn văn bản 200-500 từ đã chia nhỏ (Chunking Strategy). |
| `embedding` | Vector 1536 chiều được sinh bởi mô hình Embedding (OpenAI `text-embedding-3-small` hoặc tương đương). |

### 2.3. Quan hệ ERD (Entity Relationship Diagram)

```
┌─────────────────────┐          ┌─────────────────────┐
│   chat_sessions     │          │ knowledge_documents  │
│─────────────────────│          │──────────────────────│
│ id (PK, UUID)       │          │ id (PK, UUID)        │
│ customer_id (UUID)  │          │ title                │
│ session_token       │          │ source_type          │
│ title               │          │ original_content     │
│ is_active           │          │ is_active            │
│ created_at          │          │ created_at           │
└─────────┬───────────┘          └──────────┬───────────┘
          │ 1:N                             │ 1:N
          ▼                                 ▼
┌─────────────────────┐          ┌──────────────────────┐
│   chat_messages     │          │  document_chunks     │
│─────────────────────│          │──────────────────────│
│ id (PK, BIGSERIAL)  │          │ id (PK, BIGSERIAL)   │
│ session_id (FK)     │          │ document_id (FK)     │
│ role                │          │ chunk_index          │
│ content             │          │ content              │
│ tool_calls (JSONB)  │          │ embedding (vector)   │
│ tool_call_id        │          │ created_at           │
│ metadata (JSONB)    │          └──────────────────────┘
│ created_at          │
└─────────────────────┘
```

---

## 3. TRỢ LÝ MUA SẮM AI — TOOL CALLING

### 3.1. Danh sách Tool (Công cụ AI được phép sử dụng)

AI hoạt động như một **Agent có quyền hạn giới hạn**. Mỗi Tool được định nghĩa dưới dạng JSON Schema theo chuẩn OpenAI Function Calling / Gemini Tool Use, đưa cho LLM để tự quyết định khi nào cần gọi.

#### Tool 1: `search_products` — Tìm kiếm sản phẩm

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Tìm sản phẩm theo mô tả ngôn ngữ tự nhiên, lọc theo giá, danh mục |
| **API nội bộ** | `GET catalog-service:3002/api/catalog/products` |
| **Tham số** | `query` (string), `category_id` (string, optional), `min_price` (number, optional), `max_price` (number, optional), `sort` (string: `price_asc`, `price_desc`, `newest`), `limit` (number, default: 5) |
| **Kết quả trả về** | Danh sách sản phẩm (tên, giá, hình ảnh, slug, danh mục, tồn kho, khuyến mãi) |

**Ví dụ kịch bản:** Khách hỏi *"Tìm cho tôi điện thoại chụp ảnh đẹp tầm giá 15 triệu"*
→ AI phân tích: `query = "điện thoại chụp ảnh"`, `max_price = 15000000`
→ Gọi `search_products({query: "điện thoại chụp ảnh", max_price: 15000000})`
→ Trả về danh sách kèm Product Action Cards.

#### Tool 2: `get_product_details` — Xem chi tiết sản phẩm

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Lấy toàn bộ thông tin chi tiết của 1 sản phẩm (mô tả, biến thể, giá từng size/màu, tồn kho, hình ảnh, khuyến mãi) |
| **API nội bộ** | `GET catalog-service:3002/api/catalog/products/:id` |
| **Tham số** | `product_id` (string, required) |
| **Kết quả trả về** | Object đầy đủ: name, description, variants (attributes, price, stock), images, promotions |

**Ví dụ kịch bản:** Khách hỏi *"Cho tôi xem thêm thông tin về con chuột Logitech G502"*
→ AI đã có `product_id` từ kết quả search trước đó
→ Gọi `get_product_details({product_id: "uuid-xxx"})`

#### Tool 3: `add_to_cart` — Thêm sản phẩm vào giỏ hàng

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Thêm sản phẩm với biến thể (size, màu...) cụ thể vào giỏ hàng của khách |
| **API nội bộ** | `POST cart-service:3003/api/cart/items` (Header: `x-user-id`) |
| **Tham số** | `product_id` (string, required), `variant_id` (string, required), `quantity` (number, default: 1) |
| **Yêu cầu bảo mật** | Bắt buộc đăng nhập. `customer_id` lấy từ JWT, KHÔNG phải từ input của AI. |

**Ví dụ kịch bản:** Khách nhắn *"Thêm cái áo này size L vào giỏ giúp tôi"*
→ AI dựa vào ngữ cảnh hội thoại trước đó → xác định `product_id` và `variant_id` (size L)
→ Gọi `add_to_cart({product_id: "uuid-xxx", variant_id: "uuid-yyy", quantity: 1})`

#### Tool 4: `update_cart_item` — Cập nhật số lượng sản phẩm trong giỏ

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Tăng/giảm số lượng 1 sản phẩm trong giỏ |
| **API nội bộ** | `PUT cart-service:3003/api/cart/items/:itemId` (Header: `x-user-id`) |
| **Tham số** | `item_id` (string, required), `quantity` (number, required) |
| **Yêu cầu bảo mật** | Bắt buộc đăng nhập |

#### Tool 5: `remove_cart_item` — Xóa sản phẩm khỏi giỏ

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Loại bỏ sản phẩm khỏi giỏ hàng |
| **API nội bộ** | `DELETE cart-service:3003/api/cart/items/:itemId` (Header: `x-user-id`) |
| **Tham số** | `item_id` (string, required) |
| **Yêu cầu bảo mật** | Bắt buộc đăng nhập |

**Ví dụ kịch bản:** Khách nhắn *"Bỏ cái ốp lưng ra khỏi giỏ"*
→ AI gọi `get_cart` trước → tìm item có tên chứa "ốp lưng" → lấy `item_id`
→ Gọi `remove_cart_item({item_id: "123"})`

#### Tool 6: `get_cart` — Xem giỏ hàng hiện tại

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Lấy toàn bộ giỏ hàng của khách (tên SP, số lượng, giá, hình ảnh) |
| **API nội bộ** | `GET cart-service:3003/api/cart` (Header: `x-user-id`) |
| **Tham số** | Không có (customer_id lấy từ header) |
| **Yêu cầu bảo mật** | Bắt buộc đăng nhập |

#### Tool 7: `get_orders` — Tra cứu danh sách đơn hàng

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Lấy danh sách đơn hàng của khách (lọc theo trạng thái, phân trang) |
| **API nội bộ** | `GET order-service:3004/api/orders` (Header: `x-user-id`, `x-user-role`) |
| **Tham số** | `status` (string, optional: `PENDING_PAYMENT`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`), `page` (number), `limit` (number) |
| **Yêu cầu bảo mật** | Bắt buộc đăng nhập |

**Ví dụ kịch bản:** Khách hỏi *"Đơn hàng hôm qua của tôi đã giao chưa?"*
→ AI gọi `get_orders({status: "SHIPPING", limit: 5})`
→ Phân tích kết quả, tóm tắt lại cho khách: "Đơn #xxx đang ở trạng thái Đang giao hàng"

#### Tool 8: `get_order_detail` — Xem chi tiết 1 đơn hàng

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Lấy thông tin chi tiết 1 đơn hàng cụ thể |
| **API nội bộ** | `GET order-service:3004/api/orders/:orderId` (Header: `x-user-id`, `x-user-role`) |
| **Tham số** | `order_id` (string, required) |
| **Yêu cầu bảo mật** | Bắt buộc đăng nhập. Chống IDOR: Order Service tự kiểm tra `customer_id` khớp. |

#### Tool 9: `cancel_order` — Hủy đơn hàng ⚠️ (Hành động nhạy cảm)

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Hủy đơn hàng đang ở trạng thái `PENDING_PAYMENT` hoặc `CONFIRMED` |
| **API nội bộ** | `PUT order-service:3004/api/orders/:orderId/cancel` (Header: `x-user-id`, `x-user-role`) |
| **Tham số** | `order_id` (string, required) |
| **Yêu cầu bảo mật** | Bắt buộc đăng nhập + **AI phải hỏi xác nhận trước khi gọi** |
| **Saga tự động** | Order Service tự động kích hoạt luồng Compensation: Release Stock → Update Payment Status |

#### Tool 10: `check_promotions` — Tra cứu khuyến mãi khả dụng

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Tìm mã khuyến mãi / Flash Sale đang có hiệu lực cho giỏ hàng hiện tại |
| **API nội bộ** | `GET catalog-service:3002/api/catalog/promotions` (lọc `is_active = true`, `valid_from <= NOW()`, `valid_to > NOW()`) |
| **Tham số** | `product_ids` (string[], optional — danh sách SP trong giỏ) |

#### Tool 11: `search_knowledge_base` — Tra cứu chính sách/FAQ (RAG)

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | Tìm kiếm các đoạn chính sách liên quan nhất để trả lời câu hỏi chính sách/FAQ |
| **Cơ chế** | Gọi nội bộ trong `ai-service` (không gọi ra service khác) |
| **Tham số** | `query` (string, required), `top_k` (number, default: 3) |
| **Kết quả trả về** | Top K đoạn chính sách có điểm Cosine Similarity cao nhất |

#### Tool 12: `compare_products` — So sánh sản phẩm

| Thuộc tính | Giá trị |
|---|---|
| **Mục đích** | So sánh 2-4 sản phẩm theo thuộc tính kỹ thuật, giá, ưu/nhược điểm |
| **API nội bộ** | Gọi `get_product_details` cho từng sản phẩm → AI tổng hợp bảng so sánh |
| **Tham số** | `product_ids` (string[], required, min: 2, max: 4) |

### 3.2. Luồng xử lý Tool Calling chi tiết

```
Khách gửi tin nhắn
        │
        ▼
┌─────────────────────────┐
│ 1. Lưu tin nhắn vào DB  │
│    (chat_messages)       │
└───────────┬─────────────┘
            ▼
┌─────────────────────────────────────────┐
│ 2. Load lịch sử chat (10 tin nhắn gần  │
│    nhất) + System Prompt + RAG Context  │
└───────────┬─────────────────────────────┘
            ▼
┌─────────────────────────────────────────┐
│ 3. Gửi tới LLM Provider (OpenAI API)   │
│    Kèm: messages[] + tools[] + context  │
└───────────┬─────────────────────────────┘
            ▼
     ┌──────┴───────┐
     │ LLM quyết    │
     │ định có cần  │
     │ gọi Tool?    │
     └──────┬───────┘
       ┌────┴────┐
       │         │
    CÓ Tool   KHÔNG Tool
       │         │
       ▼         ▼
┌──────────┐  ┌──────────────────┐
│ 4a. Kiểm │  │ 4b. Trả lời trực│
│ tra Auth │  │ tiếp bằng Text  │
│ (đã đăng │  └────────┬─────────┘
│ nhập?)   │           │
└────┬─────┘           │
     │                 │
     ▼                 │
┌──────────────┐       │
│ 4c. Gọi     │       │
│ Internal API │       │
│ (Cart/Order/ │       │
│  Catalog)    │       │
└────┬─────────┘       │
     │                 │
     ▼                 │
┌──────────────┐       │
│ 5. Đưa kết  │       │
│ quả Tool về │       │
│ cho LLM tổng│       │
│ hợp phản hồi│       │
└────┬─────────┘       │
     │                 │
     ▼                 ▼
┌──────────────────────────────┐
│ 6. Stream phản hồi về       │
│    Frontend qua SSE          │
│    (Text + metadata JSON     │
│     cho Product Cards)       │
└──────────────────────────────┘
```

---

## 4. HỆ THỐNG RAG CHO KNOWLEDGE BASE

### 4.1. Quy trình Ingestion (Nạp dữ liệu chính sách)

Đây là quy trình **chạy 1 lần** khi setup, hoặc chạy lại khi có tài liệu chính sách mới:

```
Tài liệu gốc (.txt / .md / .pdf)
        │
        ▼
┌──────────────────────────┐
│ 1. Đọc & Chuẩn hóa      │
│    (Parse text, loại bỏ  │
│     ký tự đặc biệt)     │
└───────────┬──────────────┘
            ▼
┌──────────────────────────┐
│ 2. Chunking Strategy     │
│    Chia thành đoạn nhỏ   │
│    200-500 từ/chunk      │
│    Overlap 50 từ giữa    │
│    các chunk liền kề     │
└───────────┬──────────────┘
            ▼
┌──────────────────────────────────────┐
│ 3. Gọi Embedding API               │
│    (OpenAI text-embedding-3-small)  │
│    Input: chunk text                │
│    Output: vector[1536]             │
└───────────┬──────────────────────────┘
            ▼
┌──────────────────────────┐
│ 4. Lưu vào PostgreSQL   │
│    knowledge_documents   │
│    + document_chunks     │
│    (pgvector)            │
└──────────────────────────┘
```

**Chunking Strategy:**
- **Kích thước mỗi chunk:** 200-500 từ (tùy độ dài đoạn chính sách).
- **Overlap (Chồng lấn):** 50 từ giữa 2 chunk liền kề để tránh mất ngữ cảnh tại ranh giới.
- **Ranh giới tự nhiên:** Ưu tiên cắt tại dấu chấm cuối câu, không cắt giữa câu.

### 4.2. Quy trình Retrieval (Truy vấn khi khách hỏi)

```
Câu hỏi khách hàng: "Chính sách đổi trả hàng như thế nào?"
        │
        ▼
┌───────────────────────────────────┐
│ 1. Gọi Embedding API             │
│    Input: "Chính sách đổi trả    │
│            hàng như thế nào?"     │
│    Output: query_vector[1536]     │
└───────────┬───────────────────────┘
            ▼
┌───────────────────────────────────────────┐
│ 2. Truy vấn pgvector (Cosine Similarity) │
│                                           │
│  SELECT content, 1 - (embedding <=>       │
│    $1::vector) AS score                   │
│  FROM document_chunks                     │
│  WHERE (SELECT id FROM                    │
│    knowledge_documents WHERE              │
│    is_active = true) = document_id        │
│  ORDER BY embedding <=> $1::vector        │
│  LIMIT 3;                                 │
└───────────┬───────────────────────────────┘
            ▼
┌───────────────────────────────────────────┐
│ 3. Ghép Context vào System Prompt         │
│                                           │
│  "Dưới đây là các điều khoản chính sách  │
│   liên quan. Hãy trả lời dựa trên đó:   │
│                                           │
│   [Chunk 1]: ... (score: 0.92)           │
│   [Chunk 2]: ... (score: 0.87)           │
│   [Chunk 3]: ... (score: 0.81)"          │
└───────────┬───────────────────────────────┘
            ▼
┌───────────────────────────────────────────┐
│ 4. LLM tổng hợp và trả lời bằng ngôn    │
│    ngữ tự nhiên, trích dẫn đúng nguồn    │
└───────────────────────────────────────────┘
```

### 4.3. System Prompt — Ngăn chặn Hallucination

```text
Bạn là Trợ lý mua sắm AI của Sàn Thương Mại Điện Tử. 
Hãy tuân thủ các quy tắc sau:

1. TUYỆT ĐỐI KHÔNG được bịa đặt thông tin về chính sách, quy định, 
   điều khoản của sàn. Chỉ trả lời dựa trên nội dung Context được cung cấp.

2. Nếu Context không chứa thông tin liên quan đến câu hỏi, hãy trả lời:
   "Xin lỗi, tôi không tìm thấy thông tin về vấn đề này trong quy chế 
    của sàn. Bạn vui lòng liên hệ Hotline: 1900-xxxx để được hỗ trợ 
    chi tiết hơn nhé!"

3. Khi trả lời về sản phẩm, luôn sử dụng dữ liệu thực từ Tool. 
   Không tự suy đoán giá, tồn kho hay thông số kỹ thuật.

4. Đối với các hành động nhạy cảm (hủy đơn, xóa giỏ hàng), 
   LUÔN hỏi xác nhận trước khi thực thi. Cung cấp thông tin tóm tắt 
   đơn hàng/sản phẩm trước khi khách quyết định.

5. Nếu khách hàng chưa đăng nhập mà yêu cầu thao tác giỏ hàng 
   hoặc đơn hàng, hãy hướng dẫn đăng nhập trước.

6. Phản hồi bằng Tiếng Việt, lịch sự, thân thiện, ngắn gọn.
```

### 4.4. Danh mục nội dung Knowledge Base

Các tài liệu cần nạp vào hệ thống RAG:

| STT | Chủ đề | Loại (`source_type`) | Mô tả |
|---|---|---|---|
| 1 | Chính sách đổi trả hàng | `POLICY` | Điều kiện đổi trả trong 7 ngày, quy trình, sản phẩm không được đổi trả |
| 2 | Chính sách bảo hành | `WARRANTY` | Điều kiện bảo hành, thời hạn, trung tâm bảo hành |
| 3 | Chi phí và thời gian vận chuyển | `SHIPPING` | Phí ship theo khu vực, thời gian giao hàng dự kiến, freeship trên 500k |
| 4 | Hướng dẫn thanh toán | `FAQ` | Cách thanh toán qua VNPay, MoMo, COD. Xử lý khi thanh toán lỗi |
| 5 | Hướng dẫn hủy đơn & hoàn tiền | `FAQ` | Quy trình hủy đơn, thời gian hoàn tiền, điều kiện hủy |
| 6 | Quy chế hoạt động sàn | `POLICY` | Quy định chung về sàn TMĐT, quyền và nghĩa vụ các bên |

---

## 5. TRẢI NGHIỆM NGƯỜI DÙNG & GIAO DIỆN

### 5.1. Chat Widget (Cửa sổ chat nổi)

- **Vị trí:** Nút tròn nổi (Floating Action Button) ở góc phải dưới màn hình, có biểu tượng AI / Robot.
- **Khi mở:** Hiển thị cửa sổ chat với giao diện Bubble Message (giống Messenger/Zalo).
- **Responsive:** Trên mobile sẽ chiếm toàn màn hình (Full-screen overlay).

### 5.2. Product Action Cards (Thẻ sản phẩm tương tác)

Khi AI trả kết quả tìm kiếm sản phẩm, ngoài văn bản mô tả, Frontend sẽ render thêm các **Card tương tác** kèm theo dựa trên trường `metadata` trong `chat_messages`:

**Cấu trúc JSON `metadata` cho Product Cards:**
```json
{
  "type": "product_cards",
  "products": [
    {
      "id": "uuid-xxx",
      "name": "iPhone 15 Pro Max 256GB",
      "slug": "iphone-15-pro-max-256gb",
      "image_url": "https://...",
      "price": 28990000,
      "original_price": 32990000,
      "discount_percent": 12,
      "category": "Điện thoại",
      "in_stock": true,
      "variant_id": "uuid-yyy"
    }
  ]
}
```

**Mỗi Card hiển thị:**
- Hình ảnh sản phẩm (thumbnail)
- Tên sản phẩm
- Giá bán (gạch giá gốc nếu có khuyến mãi)
- Nút **"Xem chi tiết"** → Chuyển hướng đến trang Product Detail (`/product/:slug`)
- Nút **"Thêm vào giỏ"** → Gửi lệnh chat ngầm cho AI gọi Tool `add_to_cart`

### 5.3. Bảng so sánh sản phẩm

**Cấu trúc JSON `metadata` cho Comparison Table:**
```json
{
  "type": "comparison_table",
  "products": ["iPhone 15 Pro Max", "Samsung Galaxy S24 Ultra"],
  "attributes": [
    { "name": "Giá", "values": ["28.990.000đ", "31.990.000đ"] },
    { "name": "Màn hình", "values": ["6.7\" OLED", "6.8\" AMOLED"] },
    { "name": "RAM", "values": ["8GB", "12GB"] },
    { "name": "Pin", "values": ["4422mAh", "5000mAh"] }
  ],
  "recommendation": "Samsung Galaxy S24 Ultra phù hợp hơn nếu bạn cần pin lâu và RAM lớn."
}
```

---

## 6. CƠ CHẾ AN TOÀN & XÁC THỰC NGỮ CẢNH

### 6.1. Kiểm tra trạng thái đăng nhập

```
Khách yêu cầu thao tác (Giỏ hàng / Đơn hàng)
        │
        ▼
┌──────────────────────────┐
│ Kiểm tra JWT Token       │
│ (x-user-id có tồn tại?) │
└───────────┬──────────────┘
       ┌────┴────┐
       │         │
    CÓ Token  KHÔNG Token
       │         │
       ▼         ▼
  Tiếp tục    AI phản hồi:
  thực thi    "Bạn cần đăng nhập
  Tool        trước khi thực hiện
              thao tác này nhé!
              👉 [Đăng nhập ngay]"
```

### 6.2. Xác nhận trước hành động nhạy cảm

Các Tool có tính chất **hủy/xóa/thay đổi lớn** sẽ yêu cầu AI hỏi xác nhận 2 bước:

**Bước 1 — AI tóm tắt:**
> "Bạn muốn hủy đơn hàng #28410417 với tổng giá trị 1.250.000đ, gồm 2 sản phẩm:
> - Áo thun cotton trắng (x2)
> - Quần jean xanh (x1)
>
> Xác nhận hủy đơn này không?"

**Bước 2 — Khách xác nhận:**
> "Ừ, hủy đi"

→ AI mới thực sự gọi Tool `cancel_order`.

### 6.3. Bảo vệ dữ liệu (Chống IDOR)

- **AI KHÔNG BAO GIỜ** nhận `customer_id` từ tin nhắn của khách. `customer_id` luôn được lấy từ JWT Token đã xác thực tại API Gateway.
- Khi `ai-service` gọi Internal API đến `cart-service` hoặc `order-service`, luôn truyền header `x-user-id` từ Token, không phải từ input AI.
- Các service đích (`order-service`) tự kiểm tra lại `customer_id` khớp → Ngăn chặn IDOR hoàn toàn.

---

## 7. LỘ TRÌNH TRIỂN KHAI

### Phase 1: Nền tảng AI Service + RAG cơ bản (Tuần 1-2)
- [ ] Tạo `ai-service` (Express + TypeScript + Prisma).
- [ ] Tạo `ai_db` với schema `chat_sessions`, `chat_messages`, `knowledge_documents`, `document_chunks`.
- [ ] Tích hợp LLM Provider (OpenAI API / Gemini API).
- [ ] Xây dựng RAG Pipeline: Ingestion → Chunking → Embedding → pgvector.
- [ ] Nạp tài liệu chính sách cơ bản (đổi trả, vận chuyển, thanh toán).
- [ ] Test: AI trả lời được câu hỏi chính sách, từ chối lịch sự khi thiếu dữ liệu.

### Phase 2: Tool Calling — Tìm kiếm & Tư vấn (Tuần 3)
- [ ] Implement Tool `search_products`, `get_product_details`, `compare_products`.
- [ ] Implement Tool `check_promotions`.
- [ ] Xây dựng cấu trúc `metadata` JSON cho Product Cards & Comparison Table.
- [ ] Cập nhật API Gateway: thêm route `/ai` → `ai-service`.
- [ ] Test: AI tìm kiếm sản phẩm theo ngôn ngữ tự nhiên, hiển thị Product Cards.

### Phase 3: Tool Calling — Thao tác Giỏ hàng & Đơn hàng (Tuần 4)
- [ ] Implement Tool `get_cart`, `add_to_cart`, `update_cart_item`, `remove_cart_item`.
- [ ] Implement Tool `get_orders`, `get_order_detail`, `cancel_order`.
- [ ] Implement cơ chế xác nhận 2 bước cho hành động nhạy cảm.
- [ ] Test: AI thêm/xóa giỏ hàng, tra cứu/hủy đơn hàng qua chat.

### Phase 4: Frontend Chat Widget + Polish (Tuần 5)
- [ ] Xây dựng React Component `ChatWidget` (Floating Button + Chat Window).
- [ ] Render Product Action Cards, Comparison Table, Order Status Cards.
- [ ] Tích hợp SSE (Server-Sent Events) cho streaming response.
- [ ] Responsive design (Mobile fullscreen).
- [ ] Cập nhật `docker-compose.yml` thêm container `ai-service`.

---

## 8. KẾT QUẢ ĐẠT ĐƯỢC

### 8.1. Về trải nghiệm người dùng
- Khách hàng được hỗ trợ tư vấn **24/7** mà không cần nhân viên trực.
- Thao tác mua sắm nhanh chóng qua giọng nói/văn bản tự nhiên — **giảm ma sát** trong hành trình mua hàng.
- Trả lời chính xác các câu hỏi chính sách — **tăng độ tin cậy** của sàn.

### 8.2. Về kỹ thuật
- **Không ảnh hưởng** tới các service cốt lõi hiện tại (Cart, Order, Catalog, Payment).
- **Không sửa đổi** bất kỳ bảng dữ liệu nào đang có. Chỉ tạo thêm `ai_db` mới hoàn toàn độc lập.
- Tận dụng tối đa hạ tầng hiện tại: `pgvector` (đã cài sẵn), RabbitMQ, API Gateway.
- Kiến trúc dễ mở rộng: thêm Tool mới chỉ cần định nghĩa JSON Schema + viết hàm gọi API.

### 8.3. Về kinh doanh
- Tăng **Conversion Rate (CVR)** nhờ tư vấn đúng nhu cầu và hỗ trợ thao tác nhanh.
- Giảm **chi phí vận hành CSKH** (Customer Support) nhờ AI tự trả lời FAQ/chính sách.
- Tạo **lợi thế cạnh tranh** so với các sàn TMĐT không có AI Assistant.
