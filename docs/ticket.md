# TÀI LIỆU THIẾT KẾ KỸ THUẬT: HỆ THỐNG TICKET CSKH THÔNG MINH

---

## MỤC LỤC
1. [Tổng quan & Mục tiêu](#1-tổng-quan--mục-tiêu)
2. [Kiến trúc Hệ thống](#2-kiến-trúc-hệ-thống)
3. [Thiết kế Cơ sở Dữ liệu](#3-thiết-kế-cơ-sở-dữ-liệu)
4. [Phân tích Cảm xúc & Xếp hạng Ưu tiên (AI Analyzer)](#4-phân-tích-cảm-xúc--xếp-hạng-ưu-tiên-ai-analyzer)
5. [RAG Auto-Draft — Tự soạn Câu trả lời](#5-rag-auto-draft--tự-soạn-câu-trả-lời)
6. [Kênh phát sinh Ticket](#6-kênh-phát-sinh-ticket)
7. [API Endpoints](#7-api-endpoints)
8. [Giao diện Agent Dashboard (Human-in-the-loop)](#8-giao-diện-agent-dashboard-human-in-the-loop)
9. [Giao diện Khách hàng — Form Gửi Ticket](#9-giao-diện-khách-hàng--form-gửi-ticket)
10. [Tích hợp với Hệ thống hiện tại](#10-tích-hợp-với-hệ-thống-hiện-tại)
11. [Các bước Triển khai Chi tiết](#11-các-bước-triển-khai-chi-tiết)

---

## 1. TỔNG QUAN & MỤC TIÊU

### 1.1. Mô tả

Hệ thống **Ticket CSKH Thông minh** là module bổ sung cho sàn thương mại điện tử, cho phép:

- **Khách hàng** gửi yêu cầu hỗ trợ / khiếu nại qua **form trên website** hoặc được **AI Shopping Assistant tự động chuyển tiếp** (escalate) khi phát hiện khách bức xúc.
- **AI tự động phân tích** mức độ giận dữ (Sentiment Score) và phân hạng ưu tiên (Priority Level) cho mỗi ticket.
- **AI tự động soạn thảo** câu trả lời mẫu dựa trên RAG Knowledge Base (chính sách đổi trả, bảo hành, hoàn tiền...).
- **Nhân viên CSKH** review câu trả lời AI gợi ý trên **Agent Dashboard**, chỉnh sửa nếu cần, rồi bấm **"Duyệt & Gửi"** → Email phản hồi được gửi đến khách qua `notification-service`.

### 1.2. Mô hình: Human-in-the-loop (HITL)

```
  AI không tự ý gửi thư cho khách.
  AI chỉ LÀM NHÁP → Nhân viên DUYỆT → Hệ thống MỚI GỬI.
```

Mô hình này đảm bảo:
- ✅ Tốc độ phản hồi nhanh (AI soạn sẵn 80% nội dung).
- ✅ Chất lượng đảm bảo (con người kiểm tra lần cuối).
- ✅ Tránh rủi ro AI trả lời sai chính sách hoặc thiếu tế nhị.

### 1.3. Vị trí trong Hệ sinh thái

| Service | Port | Vai trò |
|---|---|---|
| `identity-service` | 3001 | Xác thực người dùng & nhân viên |
| `catalog-service` | 3002 | Sản phẩm, danh mục |
| `cart-service` | 3003 | Giỏ hàng |
| `order-service` | 3004 | Đơn hàng |
| `payment-service` | 3005 | Thanh toán |
| `notification-service` | 3006 | Gửi email qua RabbitMQ |
| `recommendation-service` | 3007 | Gợi ý sản phẩm |
| `ai-service` | 3008 | Trợ lý AI mua sắm & RAG Engine |
| **`support-service`** | **3009** | **Ticket CSKH thông minh (MỚI)** |

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Sơ đồ Kiến trúc Tổng thể

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                                 │
│                                                                         │
│  ┌──────────────────┐     ┌──────────────────────────────────────────┐  │
│  │  Chat Widget     │     │  Agent Dashboard (/admin/tickets)        │  │
│  │  (AI Assistant)  │     │  ┌──────────┐ ┌─────────┐ ┌──────────┐ │  │
│  │                  │     │  │ Danh sách │ │Chi tiết │ │ Duyệt &  │ │  │
│  │  Phát hiện khách │     │  │ Ticket    │ │ Ticket  │ │ Gửi TL   │ │  │
│  │  bức xúc →       │     │  │ (ưu tiên)│ │(Cảm xúc)│ │ (HITL)   │ │  │
│  │  Auto Escalate   │     │  └──────────┘ └─────────┘ └──────────┘ │  │
│  └────────┬─────────┘     └──────────────────┬───────────────────────┘  │
│           │                                  │                          │
│  ┌────────┴──────────────────┐               │                          │
│  │ Form Gửi Hỗ Trợ          │               │                          │
│  │ (/support/new-ticket)     │               │                          │
│  └────────┬──────────────────┘               │                          │
└───────────┼──────────────────────────────────┼──────────────────────────┘
            │                                  │
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Port 3000)                          │
│              verifyToken() + route /support → support-service           │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  SUPPORT-SERVICE (Port 3009)                             │
│                                                                         │
│  ┌─────────────────┐   ┌──────────────────┐   ┌─────────────────────┐  │
│  │  Ticket Router  │   │  AI Analyzer     │   │  Draft Generator    │  │
│  │  & Controller   │   │  (Sentiment +    │   │  (RAG Auto-Draft)   │  │
│  │                 │   │   Priority)       │   │                     │  │
│  └────────┬────────┘   └────────┬─────────┘   └────────┬────────────┘  │
│           │                     │                       │               │
│           │            ┌────────▼─────────┐    ┌───────▼────────────┐  │
│           │            │  LLM SDK         │    │  Gọi ai-service    │  │
│           │            │  (OpenAI/Gemini) │    │  RAG Query API     │  │
│           │            │  Prompt: Phân    │    │  GET /api/ai/rag/  │  │
│           │            │  tích cảm xúc    │    │  query             │  │
│           │            └──────────────────┘    └────────────────────┘  │
│           │                                                            │
│           ▼                                                            │
│     support_db (PostgreSQL)                                            │
│     ┌──────────────────────────────────────────────┐                   │
│     │ tickets │ ticket_messages │ ticket_responses  │                   │
│     └──────────────────────────────────────────────┘                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────────┐
              │              │                  │
              ▼              ▼                  ▼
    ┌──────────────┐  ┌─────────────┐  ┌────────────────────┐
    │ ai-service   │  │ notification│  │ identity-service   │
    │ (RAG Query)  │  │ -service    │  │ (Xác thực Staff)   │
    │ Port 3008    │  │ (Gửi Email) │  │ Port 3001          │
    │              │  │ Port 3006   │  │                    │
    └──────────────┘  └─────────────┘  └────────────────────┘
```

### 2.2. Luồng Xử lý Ticket (Lifecycle)

```
┌──────────────┐
│  TICKET MỚI  │ ← Từ Form hoặc Escalate từ AI Chat
│  (OPEN)      │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│  AI ANALYZER                     │
│  ─────────────────────           │
│  1. Phân tích Sentiment          │
│     → ANGRY / FRUSTRATED /       │
│       DISAPPOINTED / NEUTRAL     │
│  2. Chấm điểm Urgency (1-100)   │
│  3. Phân hạng Priority           │
│     → P1 (Critical) / P2 (High) │
│       / P3 (Medium) / P4 (Low)  │
│  4. Trích xuất Category          │
│     → REFUND / WARRANTY /        │
│       SHIPPING / PAYMENT / OTHER │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  RAG AUTO-DRAFT                  │
│  ─────────────────────           │
│  1. Gọi ai-service RAG API      │
│     → Lấy Top 3 chunk chính     │
│       sách liên quan             │
│  2. Ghép context vào Prompt      │
│  3. LLM sinh câu trả lời mẫu   │
│     (giọng xoa dịu, trích dẫn   │
│      đúng chính sách)            │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────┐
│  PENDING_REVIEW  │ ← Chờ nhân viên duyệt
│  (Có AI Draft)   │
└──────┬───────────┘
       │
       ▼ (Nhân viên vào Dashboard)
┌──────────────────────────────────┐
│  HUMAN-IN-THE-LOOP               │
│  ─────────────────────           │
│  1. Xem ticket + Sentiment      │
│  2. Đọc AI Draft                 │
│  3. Chỉnh sửa nếu cần          │
│  4. Bấm "Duyệt & Gửi"          │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────┐
│   RESPONDED      │ ← Email đã gửi cho khách
└──────┬───────────┘
       │
       ▼ (Khách phản hồi lại?)
  ┌────┴────┐
  │         │
 CÓ       KHÔNG
  │         │
  ▼         ▼
REOPENED  RESOLVED
(Vòng     (Đóng
 lặp)      ticket)
```

### 2.3. Trạng thái Ticket (State Machine)

```
OPEN → ANALYZING → PENDING_REVIEW → RESPONDED → RESOLVED
                                         │            ↑
                                         └─ REOPENED ─┘

Trường hợp đặc biệt:
- Bất kỳ trạng thái nào → CLOSED (Admin đóng thủ công)
- ANALYZING thất bại → OPEN (fallback, nhân viên tự xử lý)
```

| Trạng thái | Mô tả |
|---|---|
| `OPEN` | Ticket vừa được tạo, chưa qua AI phân tích |
| `ANALYZING` | AI đang phân tích cảm xúc & soạn draft (thường < 10 giây) |
| `PENDING_REVIEW` | AI đã hoàn tất, chờ nhân viên CSKH review & duyệt |
| `RESPONDED` | Nhân viên đã duyệt & gửi email trả lời cho khách |
| `REOPENED` | Khách phản hồi lại sau khi nhận thư → Ticket mở lại |
| `RESOLVED` | Ticket được đóng thành công (nhân viên hoặc khách xác nhận) |
| `CLOSED` | Admin đóng thủ công (spam, duplicate, không hợp lệ) |

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU

### 3.1. Nguyên tắc

- Tạo database **`support_db`** hoàn toàn độc lập.
- Nếu muốn tắt tính năng Ticket, chỉ cần xóa container `support-service` và database `support_db`.
- Không sửa đổi bất kỳ database hiện tại nào.

### 3.2. Schema

#### Bảng `tickets` — Quản lý ticket

```sql
CREATE TABLE tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number   VARCHAR(20) UNIQUE NOT NULL,     -- Mã hiển thị: TK-20261028-001
    customer_id     UUID NOT NULL,                    -- UUID khách hàng (từ JWT)
    customer_email  VARCHAR(255) NOT NULL,            -- Email khách (để gửi phản hồi)
    customer_name   VARCHAR(255),                     -- Tên khách hàng

    -- Nội dung ticket
    subject         VARCHAR(500) NOT NULL,            -- Tiêu đề: "Đơn hàng bị hư hỏng"
    category        VARCHAR(50) DEFAULT 'OTHER',     -- REFUND, WARRANTY, SHIPPING, PAYMENT, PRODUCT, ORDER, OTHER
    related_order_id UUID,                            -- Liên kết đơn hàng (nếu có)

    -- Nguồn phát sinh
    source          VARCHAR(30) NOT NULL,             -- 'FORM' (khách tự gửi) hoặc 'AI_ESCALATE' (AI chuyển tiếp)
    chat_session_id UUID,                             -- Session chat gốc (nếu source = AI_ESCALATE)

    -- Kết quả AI phân tích
    sentiment       VARCHAR(30),                      -- ANGRY, FRUSTRATED, DISAPPOINTED, NEUTRAL
    sentiment_score INT,                              -- Điểm cảm xúc tiêu cực (0-100, 100 = cực kỳ giận)
    priority        VARCHAR(10) DEFAULT 'P3',        -- P1 (Critical), P2 (High), P3 (Medium), P4 (Low)
    ai_category     VARCHAR(50),                      -- Danh mục AI tự phân loại (có thể khác customer chọn)
    ai_summary      TEXT,                             -- AI tóm tắt vấn đề trong 1-2 câu

    -- Trạng thái
    status          VARCHAR(30) DEFAULT 'OPEN',      -- OPEN, ANALYZING, PENDING_REVIEW, RESPONDED, REOPENED, RESOLVED, CLOSED

    -- Nhân viên xử lý
    assigned_to     UUID,                             -- UUID nhân viên CSKH được gán
    resolved_at     TIMESTAMPTZ,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);
```

| Cột | Mô tả |
|---|---|
| `ticket_number` | Mã hiển thị thân thiện dạng `TK-YYYYMMDD-XXX`, dùng để khách tra cứu và nhân viên tham chiếu. |
| `source` | `FORM` = khách tự gửi từ form Hỗ trợ. `AI_ESCALATE` = AI Shopping Assistant tự động chuyển tiếp khi phát hiện khách bức xúc. |
| `chat_session_id` | Liên kết ngược về phiên chat trong `ai_db.chat_sessions` (nếu ticket phát sinh từ AI Chat). Nhân viên có thể xem lại toàn bộ cuộc hội thoại gốc để hiểu ngữ cảnh. |
| `sentiment` / `sentiment_score` | Kết quả phân tích cảm xúc bởi AI. `ANGRY` (score 80-100), `FRUSTRATED` (60-79), `DISAPPOINTED` (40-59), `NEUTRAL` (0-39). |
| `priority` | Mức ưu tiên do AI tính toán dựa trên tổ hợp: sentiment_score + category (REFUND/WARRANTY ưu tiên hơn) + giá trị đơn hàng liên quan. |

#### Bảng `ticket_messages` — Lịch sử trao đổi trong ticket

```sql
CREATE TABLE ticket_messages (
    id              BIGSERIAL PRIMARY KEY,
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type     VARCHAR(20) NOT NULL,             -- 'CUSTOMER', 'STAFF', 'SYSTEM'
    sender_id       UUID,                              -- UUID của customer hoặc staff
    content         TEXT NOT NULL,                     -- Nội dung tin nhắn
    attachments     JSONB,                             -- Danh sách file đính kèm [{url, name, size}]
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
```

| Cột | Mô tả |
|---|---|
| `sender_type` | `CUSTOMER` = tin nhắn từ khách. `STAFF` = phản hồi từ nhân viên. `SYSTEM` = thông báo hệ thống (VD: "AI đã phân tích xong", "Ticket được chuyển cho nhân viên X"). |
| `attachments` | File đính kèm (ảnh chụp sản phẩm lỗi, hóa đơn...). Lưu URL sau khi upload lên Object Storage. |

#### Bảng `ticket_responses` — Bản nháp AI & Phản hồi chính thức

```sql
CREATE TABLE ticket_responses (
    id              BIGSERIAL PRIMARY KEY,
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,

    -- Bản nháp AI
    ai_draft        TEXT NOT NULL,                     -- Câu trả lời AI tự soạn
    rag_chunks_used JSONB,                             -- Danh sách chunk chính sách đã tham chiếu
                                                       -- [{chunk_id, content_preview, score}]
    ai_tone         VARCHAR(30),                       -- Giọng văn AI chọn: EMPATHETIC, APOLOGETIC, INFORMATIVE
    ai_confidence   INT,                               -- Mức độ tự tin của AI (0-100)

    -- Bản chỉnh sửa của nhân viên
    staff_id        UUID,                              -- Nhân viên duyệt
    final_response  TEXT,                              -- Nội dung cuối cùng (sau khi nhân viên sửa)
    staff_notes     TEXT,                              -- Ghi chú nội bộ của nhân viên

    -- Trạng thái duyệt
    review_status   VARCHAR(20) DEFAULT 'PENDING',   -- PENDING, APPROVED, REJECTED
    reviewed_at     TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,                       -- Thời điểm email được gửi

    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_responses_ticket ON ticket_responses(ticket_id);
```

| Cột | Mô tả |
|---|---|
| `ai_draft` | Bản nháp câu trả lời do AI soạn tự động, dựa trên RAG context + phân tích cảm xúc khách hàng. |
| `rag_chunks_used` | Lưu lại chính xác những đoạn chính sách nào AI đã tham chiếu khi viết draft. Nhân viên có thể click xem nguồn gốc. |
| `ai_confidence` | AI tự đánh giá độ tự tin (0-100). Nếu < 50 → hiển thị cảnh báo vàng cho nhân viên: "AI không chắc chắn về câu trả lời này, vui lòng kiểm tra kỹ". |
| `final_response` | Nội dung cuối cùng sau khi nhân viên review và chỉnh sửa. Nếu nhân viên không sửa gì → `final_response = ai_draft`. |

### 3.3. ERD (Entity Relationship Diagram)

```
┌─────────────────────────┐
│        tickets           │
│─────────────────────────│
│ id (PK, UUID)            │
│ ticket_number (UNIQUE)   │
│ customer_id (UUID)       │
│ customer_email           │
│ subject                  │
│ category                 │
│ source                   │
│ chat_session_id          │
│ sentiment                │
│ sentiment_score          │
│ priority                 │
│ status                   │
│ assigned_to              │
└─────────┬───────────────┘
          │ 1:N
     ┌────┴──────────────┐
     │                   │
     ▼                   ▼
┌──────────────────┐  ┌──────────────────────┐
│ ticket_messages  │  │ ticket_responses      │
│──────────────────│  │──────────────────────│
│ id (PK)          │  │ id (PK)              │
│ ticket_id (FK)   │  │ ticket_id (FK)       │
│ sender_type      │  │ ai_draft             │
│ sender_id        │  │ rag_chunks_used      │
│ content          │  │ ai_confidence        │
│ attachments      │  │ staff_id             │
│ created_at       │  │ final_response       │
└──────────────────┘  │ review_status        │
                      │ sent_at              │
                      └──────────────────────┘
```

---

## 4. PHÂN TÍCH CẢM XÚC & XẾP HẠNG ƯU TIÊN (AI ANALYZER)

### 4.1. Cơ chế hoạt động

`support-service` tự cấu hình SDK LLM (OpenAI hoặc Gemini) để gọi trực tiếp, **không phụ thuộc ai-service** cho phần phân tích cảm xúc.

### 4.2. Prompt phân tích cảm xúc

```text
Bạn là hệ thống phân tích cảm xúc khách hàng cho sàn thương mại điện tử.

Hãy phân tích tin nhắn/khiếu nại sau đây và trả về JSON với cấu trúc:

{
  "sentiment": "ANGRY" | "FRUSTRATED" | "DISAPPOINTED" | "NEUTRAL",
  "sentiment_score": <số nguyên 0-100, 100 = cực kỳ tiêu cực>,
  "priority": "P1" | "P2" | "P3" | "P4",
  "category": "REFUND" | "WARRANTY" | "SHIPPING" | "PAYMENT" | "PRODUCT" | "ORDER" | "OTHER",
  "summary": "<tóm tắt vấn đề trong 1-2 câu>",
  "key_issues": ["<vấn đề 1>", "<vấn đề 2>"]
}

Quy tắc phân hạng Priority:
- P1 (Critical): sentiment_score >= 80 HOẶC liên quan đến tiền (REFUND, PAYMENT lỗi) với giá trị lớn
- P2 (High): sentiment_score 60-79 HOẶC WARRANTY/SHIPPING trễ hẹn
- P3 (Medium): sentiment_score 40-59, câu hỏi thông thường cần hỗ trợ
- P4 (Low): sentiment_score < 40, hỏi thông tin chung

---
Nội dung khách hàng gửi:
"""
{TICKET_SUBJECT}

{TICKET_CONTENT}
"""
```

### 4.3. Ví dụ kết quả phân tích

**Input:** *"Tôi đặt hàng 5 ngày rồi mà chưa giao, gọi hotline không ai nghe, các bạn làm ăn kiểu gì vậy? Tôi muốn hủy đơn và hoàn tiền ngay lập tức!"*

**Output:**
```json
{
  "sentiment": "ANGRY",
  "sentiment_score": 88,
  "priority": "P1",
  "category": "SHIPPING",
  "summary": "Khách đã chờ 5 ngày chưa nhận hàng, không liên lạc được hotline, yêu cầu hủy đơn và hoàn tiền",
  "key_issues": ["Giao hàng trễ 5 ngày", "Hotline không phản hồi", "Yêu cầu hoàn tiền"]
}
```

---

## 5. RAG AUTO-DRAFT — TỰ SOẠN CÂU TRẢ LỜI

### 5.1. Luồng xử lý

```
Kết quả AI Analyzer (sentiment, category, summary)
        │
        ▼
┌───────────────────────────────────────────────┐
│ 1. Gọi ai-service RAG API                     │
│    GET ai-service:3008/api/ai/rag/query        │
│    Body: { query: summary + key_issues,        │
│            top_k: 3 }                          │
│    → Nhận về: [{content, score, document_id}]  │
└───────────────────────┬───────────────────────┘
                        ▼
┌───────────────────────────────────────────────┐
│ 2. Ghép context vào Draft Prompt              │
│                                                │
│    System: "Bạn là nhân viên CSKH chuyên      │
│    nghiệp của sàn TMĐT..."                    │
│                                                │
│    Bao gồm:                                   │
│    - Phân tích cảm xúc khách (sentiment)       │
│    - Nội dung khiếu nại gốc                    │
│    - Các chunk chính sách liên quan (RAG)       │
│    - Hướng dẫn giọng văn phù hợp              │
└───────────────────────┬───────────────────────┘
                        ▼
┌───────────────────────────────────────────────┐
│ 3. LLM sinh bản nháp câu trả lời             │
│    + Tự đánh giá confidence (0-100)            │
│    + Chọn tone: EMPATHETIC / APOLOGETIC /      │
│      INFORMATIVE                               │
└───────────────────────────────────────────────┘
```

### 5.2. Prompt soạn Draft

```text
Bạn là nhân viên CSKH chuyên nghiệp của Sàn Thương Mại Điện Tử.
Hãy soạn email phản hồi cho khách hàng dựa trên các thông tin sau:

## Thông tin khách hàng
- Tên: {customer_name}
- Mã ticket: {ticket_number}

## Phân tích cảm xúc
- Mức độ: {sentiment} (Điểm: {sentiment_score}/100)
- Vấn đề chính: {summary}

## Chính sách liên quan (từ Knowledge Base)
{rag_context_chunks}

## Quy tắc soạn thư:
1. Nếu khách ANGRY/FRUSTRATED: Mở đầu bằng lời xin lỗi chân thành, thể hiện sự thấu hiểu.
2. Trích dẫn chính xác điều khoản chính sách khi đề cập quyền lợi khách hàng.
3. Đưa ra giải pháp cụ thể, có thời hạn rõ ràng (VD: "hoàn tiền trong 3-5 ngày làm việc").
4. Kết thúc bằng cam kết hỗ trợ và thông tin liên hệ.
5. Giọng văn: Lịch sự, chuyên nghiệp, thấu cảm. KHÔNG sáo rỗng.
6. Độ dài: 150-300 từ.

Nếu chính sách trong Knowledge Base KHÔNG đủ để trả lời, hãy:
- Vẫn xin lỗi và thể hiện sự thấu hiểu
- Ghi rõ: "[CẦN KIỂM TRA THÊM: <nội dung cần xác minh>]"
- Đặt confidence thấp (< 50)

Trả về JSON:
{
  "draft": "<nội dung email>",
  "tone": "EMPATHETIC" | "APOLOGETIC" | "INFORMATIVE",
  "confidence": <0-100>,
  "policy_references": ["<tên chính sách đã trích dẫn>"]
}
```

### 5.3. Ví dụ Draft Output

```json
{
  "draft": "Kính gửi Anh Minh,\n\nThay mặt Sàn Thương Mại Điện Tử, em xin gửi lời xin lỗi chân thành về sự chậm trễ trong việc giao hàng đơn #28410417 của anh. Em hoàn toàn hiểu sự bất tiện và khó chịu mà anh đang gặp phải.\n\nSau khi kiểm tra, em xác nhận đơn hàng của anh đã bị delay do đối tác vận chuyển gặp sự cố tại kho trung chuyển. Theo chính sách của sàn:\n\n- Anh có quyền yêu cầu **hủy đơn và hoàn tiền 100%** theo Điều 3, Chính sách Đổi trả hàng: \"Đơn hàng giao trễ quá 3 ngày so với thời gian cam kết, khách hàng được hoàn tiền toàn bộ\".\n- Thời gian hoàn tiền: **3-5 ngày làm việc** kể từ khi xác nhận hủy đơn.\n\nEm sẽ tiến hành hủy đơn và khởi tạo hoàn tiền cho anh ngay sau khi nhận được xác nhận. Anh vui lòng phản hồi email này hoặc liên hệ Hotline 1900-xxxx để được hỗ trợ nhanh nhất.\n\nMột lần nữa, em xin lỗi về trải nghiệm không tốt này ạ.\n\nTrân trọng,\nĐội ngũ CSKH - Sàn Thương Mại Điện Tử",
  "tone": "APOLOGETIC",
  "confidence": 92,
  "policy_references": ["Chính sách đổi trả hàng - Điều 3"]
}
```

---

## 6. KÊNH PHÁT SINH TICKET

### 6.1. Kênh 1: Form Hỗ trợ trên Website

Khách hàng (đã đăng nhập) truy cập trang `/support/new-ticket` và điền form:

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `subject` | text | ✅ | Tiêu đề vấn đề |
| `category` | select | ✅ | Danh mục: Đổi trả, Bảo hành, Vận chuyển, Thanh toán, Khác |
| `content` | textarea | ✅ | Mô tả chi tiết vấn đề |
| `related_order_id` | select | ❌ | Chọn đơn hàng liên quan (load danh sách đơn hàng của khách) |
| `attachments` | file | ❌ | Upload ảnh/file đính kèm (tối đa 5 file, mỗi file ≤ 5MB) |

→ `source = 'FORM'`

### 6.2. Kênh 2: AI Shopping Assistant tự động Escalate

Khi AI Shopping Assistant (do Bạn 1 xây dựng) phát hiện khách hàng bức xúc trong lúc chat, sẽ gọi **Tool mới** `escalate_to_ticket`:

**Tool bổ sung cho ai-service (Bạn 1 implement):**

| Thuộc tính | Giá trị |
|---|---|
| **Tên Tool** | `escalate_to_ticket` |
| **Mục đích** | Tự động tạo ticket CSKH khi khách hàng giận dữ hoặc yêu cầu nói chuyện với người thật |
| **API nội bộ** | `POST support-service:3009/api/support/tickets/escalate` |
| **Tham số** | `chat_session_id` (string), `reason` (string — lý do escalate), `chat_summary` (string — AI tóm tắt cuộc hội thoại) |

**Payload gửi sang `support-service`:**
```json
{
  "customer_id": "uuid-from-jwt",
  "customer_email": "khach@email.com",
  "customer_name": "Nguyễn Văn A",
  "chat_session_id": "uuid-chat-session",
  "subject": "[AI Escalate] Khách hàng bức xúc về đơn hàng giao trễ",
  "content": "Tóm tắt cuộc hội thoại:\n- Khách hỏi về đơn #28410417 đặt 5 ngày trước\n- AI xác nhận đơn đang trong trạng thái SHIPPING\n- Khách bắt đầu bức xúc, yêu cầu hoàn tiền\n- Khách yêu cầu nói chuyện với người thật",
  "source": "AI_ESCALATE",
  "related_order_id": "uuid-order-xxx"
}
```

**AI Shopping Assistant phản hồi khách:**
> *"Em rất tiếc về trải nghiệm chưa tốt này ạ. Em đã tạo yêu cầu hỗ trợ khẩn cấp (Mã: TK-20261028-015) và chuyển cho bộ phận CSKH để xử lý ngay cho anh/chị. Anh/chị sẽ nhận được email phản hồi trong thời gian sớm nhất. Cảm ơn anh/chị đã kiên nhẫn ạ!"*

---

## 7. API ENDPOINTS

### 7.1. Public API (qua API Gateway, yêu cầu JWT)

#### Khách hàng

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/api/support/tickets` | Tạo ticket mới từ form | Customer |
| `GET` | `/api/support/tickets` | Xem danh sách ticket của mình | Customer |
| `GET` | `/api/support/tickets/:id` | Xem chi tiết 1 ticket | Customer (chỉ ticket của mình) |
| `POST` | `/api/support/tickets/:id/messages` | Gửi tin nhắn bổ sung / phản hồi | Customer |

#### Nhân viên CSKH (Staff/Admin)

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/api/support/admin/tickets` | Xem tất cả ticket (filter, sort, paginate) | Staff/Admin |
| `GET` | `/api/support/admin/tickets/:id` | Xem chi tiết ticket + AI analysis + Draft | Staff/Admin |
| `PUT` | `/api/support/admin/tickets/:id/assign` | Gán ticket cho nhân viên | Admin |
| `PUT` | `/api/support/admin/tickets/:id/status` | Cập nhật trạng thái ticket | Staff/Admin |
| `GET` | `/api/support/admin/tickets/:id/draft` | Xem AI Draft hiện tại | Staff |
| `PUT` | `/api/support/admin/tickets/:id/draft` | Chỉnh sửa AI Draft | Staff |
| `POST` | `/api/support/admin/tickets/:id/approve-and-send` | Duyệt & gửi email cho khách | Staff |
| `POST` | `/api/support/admin/tickets/:id/reject-draft` | Từ chối draft, yêu cầu AI viết lại | Staff |
| `GET` | `/api/support/admin/stats` | Thống kê: tổng ticket, theo trạng thái, thời gian phản hồi TB | Admin |

### 7.2. Internal API (giữa các service, không qua Gateway)

| Method | Endpoint | Gọi bởi | Mô tả |
|---|---|---|---|
| `POST` | `/api/support/tickets/escalate` | `ai-service` | AI Chat tự động tạo ticket khi khách bức xúc |

### 7.3. Gọi ra ngoài (Outbound)

| Service đích | Endpoint | Mục đích |
|---|---|---|
| `ai-service:3008` | `GET /api/ai/rag/query` | Lấy chunk chính sách liên quan từ RAG Knowledge Base |
| `notification-service:3006` | RabbitMQ: `notification.email.send` | Gửi email phản hồi cho khách sau khi nhân viên duyệt |
| `identity-service:3001` | `GET /api/identity/users/:id` | Lấy thông tin nhân viên (tên, email) để hiển thị trên Dashboard |

---

## 8. GIAO DIỆN AGENT DASHBOARD (HUMAN-IN-THE-LOOP)

### 8.1. Trang danh sách Ticket (`/admin/tickets`)

**Layout:** Bảng danh sách với các cột:

| Cột | Mô tả |
|---|---|
| Mã Ticket | `TK-20261028-001` (link đến chi tiết) |
| Tiêu đề | Subject của ticket |
| Khách hàng | Tên + email |
| Cảm xúc | Badge màu: 🔴 ANGRY, 🟠 FRUSTRATED, 🟡 DISAPPOINTED, 🟢 NEUTRAL |
| Điểm | Sentiment score (0-100) |
| Ưu tiên | Badge: P1 🔴, P2 🟠, P3 🟡, P4 🟢 |
| Danh mục | REFUND, WARRANTY, SHIPPING... |
| Trạng thái | PENDING_REVIEW, RESPONDED, RESOLVED... |
| Nguồn | 📝 Form / 🤖 AI Escalate |
| Thời gian | Thời gian tạo + thời gian chờ (VD: "2 giờ trước") |

**Tính năng:**
- **Sắp xếp mặc định:** P1 → P4, trong cùng priority thì ticket cũ lên trước (FIFO).
- **Bộ lọc:** Theo trạng thái, priority, category, nhân viên được gán, khoảng thời gian.
- **Tìm kiếm:** Theo mã ticket, tên khách, tiêu đề.

### 8.2. Trang chi tiết Ticket (`/admin/tickets/:id`)

**Layout 2 cột:**

**Cột trái (60%):**
- Thông tin ticket: Mã, tiêu đề, khách hàng, đơn hàng liên quan.
- **Phân tích AI:** Hiển thị sentiment badge, score bar (thanh tiến trình 0-100), priority badge, danh mục AI phân loại, tóm tắt vấn đề.
- **Lịch sử trao đổi:** Timeline các message (của khách, nhân viên, hệ thống) theo thứ tự thời gian.
- **Ngữ cảnh chat gốc** (nếu source = AI_ESCALATE): Hiển thị hoặc link đến cuộc hội thoại gốc trên AI Chat.

**Cột phải (40%):**
- **AI Draft Response:**
  - Hiển thị bản nháp AI đã soạn.
  - Thanh **Confidence:** (VD: "AI tự tin: 92%"). Nếu < 50% → hiển thị cảnh báo vàng.
  - **Chính sách đã tham chiếu:** Danh sách collapsible các chunk RAG mà AI đã dùng (nhân viên click xem nội dung gốc).
- **Khung chỉnh sửa:** Rich text editor cho nhân viên sửa nội dung draft.
- **Ghi chú nội bộ:** Textarea cho nhân viên ghi chú (không hiển thị cho khách).
- **Nút hành động:**
  - ✅ **"Duyệt & Gửi Email"** → Gửi `final_response` qua `notification-service`.
  - 🔄 **"Yêu cầu AI viết lại"** → Gọi lại RAG Auto-Draft với thêm hướng dẫn.
  - ❌ **"Đóng Ticket"** → Chuyển trạng thái sang `CLOSED`.

---

## 9. GIAO DIỆN KHÁCH HÀNG — FORM GỬI TICKET

### 9.1. Trang tạo ticket (`/support/new-ticket`)

- Form gửi yêu cầu hỗ trợ với các trường như mô tả ở [Mục 6.1](#61-kênh-1-form-hỗ-trợ-trên-website).
- Dropdown "Đơn hàng liên quan" tự động load danh sách đơn hàng gần đây của khách (gọi `order-service`).
- Upload ảnh drag & drop.

### 9.2. Trang danh sách ticket của tôi (`/support/my-tickets`)

- Danh sách ticket đã gửi, hiển thị trạng thái, thời gian phản hồi.
- Click vào xem chi tiết + xem phản hồi từ CSKH + gửi tin nhắn bổ sung.

---

## 10. TÍCH HỢP VỚI HỆ THỐNG HIỆN TẠI

### 10.1. Tác động đến các thành phần hiện tại

| Thành phần | Mức độ thay đổi | Chi tiết |
|---|---|---|
| Tất cả services hiện tại (1-7) | **KHÔNG thay đổi** | Giữ nguyên 100% |
| `ai-service` (Bạn 1 phát triển) | **Thay đổi nhẹ** | Bạn 1 bổ sung 1 endpoint RAG Query public `GET /api/ai/rag/query` và 1 Tool `escalate_to_ticket` |
| `api-gateway` | **Thay đổi nhẹ** | Thêm route proxy `/support` → `support-service:3009`. Thêm biến `SUPPORT_SERVICE_URL` |
| `docker-compose.yml` | **Thay đổi nhẹ** | Thêm container `support-service` (Port 3009) và database `support_db` |
| `database/init.sql` | **Thay đổi nhẹ** | Thêm 1 dòng: `CREATE DATABASE support_db;` |
| Frontend (Bạn 2 phát triển) | **Thêm trang mới** | Bạn thêm các route: `/support/*`, `/admin/tickets/*` |

### 10.2. API Contract cần thống nhất với Bạn 1

Bạn cần thống nhất với Bạn 1 duy nhất 1 API:

**`GET ai-service:3008/api/ai/rag/query`**

```
Request:
{
  "query": "Chính sách hoàn tiền khi đơn hàng giao trễ",
  "top_k": 3
}

Response:
{
  "chunks": [
    {
      "chunk_id": 15,
      "document_title": "Chính sách đổi trả hàng",
      "content": "Điều 3: Đơn hàng giao trễ quá 3 ngày...",
      "score": 0.92
    },
    ...
  ]
}
```

---

## 11. CÁC BƯỚC TRIỂN KHAI CHI TIẾT

### Bước 1: Khởi tạo Service & Database (Ngày 1-2)
- [ ] Scaffold `support-service` (Express + TypeScript + Prisma).
- [ ] Cấu hình `support_db` với schema 3 bảng: `tickets`, `ticket_messages`, `ticket_responses`.
- [ ] Cấu hình Docker container + thêm vào `docker-compose.yml`.
- [ ] Cấu hình route proxy trên `api-gateway`: `/support` → `support-service:3009`.
- [ ] Tích hợp SDK LLM (OpenAI / Gemini) vào `support-service`.

### Bước 2: Core CRUD Ticket + AI Analyzer (Ngày 3-5)
- [ ] Implement CRUD API cho tickets (tạo, xem, cập nhật trạng thái).
- [ ] Implement module AI Analyzer: nhận nội dung ticket → gọi LLM → trả về JSON sentiment/priority.
- [ ] Implement logic tự động chạy AI Analyzer khi ticket mới được tạo (`OPEN → ANALYZING → PENDING_REVIEW`).
- [ ] Implement API endpoint nhận escalate từ `ai-service` (`POST /tickets/escalate`).
- [ ] Test: Tạo ticket → AI phân tích cảm xúc đúng → chuyển sang PENDING_REVIEW.

### Bước 3: RAG Auto-Draft (Ngày 6-7)
- [ ] Kết nối API lấy RAG chunks từ `ai-service` (`GET /api/ai/rag/query`).
- [ ] Implement module Draft Generator: ghép RAG context + sentiment → gọi LLM soạn draft.
- [ ] Lưu draft vào bảng `ticket_responses` kèm `rag_chunks_used` và `ai_confidence`.
- [ ] Test: Ticket về "hoàn tiền" → AI lấy đúng chính sách đổi trả → soạn draft hợp lý.

### Bước 4: Human-in-the-loop API (Ngày 8-9)
- [ ] Implement API cho nhân viên: xem danh sách ticket, xem chi tiết + AI draft.
- [ ] Implement API chỉnh sửa draft, duyệt & gửi email (đẩy message qua RabbitMQ → `notification-service`).
- [ ] Implement API từ chối draft, yêu cầu AI viết lại.
- [ ] Implement API thống kê (tổng ticket, TB thời gian phản hồi, phân bố theo sentiment).
- [ ] Test: Nhân viên xem ticket → sửa draft → bấm Duyệt → email được gửi.

### Bước 5: Frontend — Form Khách hàng + Agent Dashboard (Ngày 10-13)
- [ ] Xây dựng trang `/support/new-ticket` (Form gửi ticket).
- [ ] Xây dựng trang `/support/my-tickets` (Danh sách ticket của khách).
- [ ] Xây dựng trang `/admin/tickets` (Dashboard danh sách ticket cho nhân viên).
- [ ] Xây dựng trang `/admin/tickets/:id` (Chi tiết ticket: 2 cột, AI Analysis, Draft Editor, Duyệt & Gửi).
- [ ] Thiết kế UI badge sentiment, priority, status với màu sắc trực quan.
- [ ] Rich text editor cho khung chỉnh sửa draft.

### Bước 6: Tích hợp & Kiểm thử End-to-End (Ngày 14)
- [ ] Test E2E: Khách gửi ticket form → AI phân tích → AI soạn draft → Nhân viên duyệt → Email gửi thành công.
- [ ] Test E2E: AI Chat escalate → Ticket tự động tạo với `source = AI_ESCALATE` → ngữ cảnh chat đầy đủ.
- [ ] Test edge case: AI confidence thấp (< 50) → cảnh báo hiển thị đúng.
- [ ] Test: Khách phản hồi lại email → Ticket REOPENED.
- [ ] Kiểm tra responsive trên mobile.
