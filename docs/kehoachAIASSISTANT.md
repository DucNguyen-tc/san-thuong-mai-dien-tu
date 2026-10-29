# KẾ HOẠCH TRIỂN KHAI AI ASSISTANT — NHÓM 3 NGƯỜI / 2 TUẦN

---

## TỔNG QUAN

### Thành viên & Phân công

| Thành viên | Vai trò | Phân hệ phụ trách |
|---|---|---|
| **Bạn 1** | Backend & AI Core Engineer | `ai-service` (Port 3008): LLM Orchestrator, RAG Engine, 12 Tool Calling, SSE Streaming |
| **Bạn 2** | Frontend & UX Engineer | Chat Widget React, Product Cards, Bảng so sánh, SSE Client, Responsive |
| **Bạn (Người 3)** | CSKH AI Copilot & Ticket System | `support-service` (Port 3009): Ticket Management, AI Sentiment Analyzer, RAG Auto-Draft, Agent Dashboard |

### Tài liệu tham chiếu

| File | Mô tả |
|---|---|
| `docs/AI_SHOPPING_ASSISTANT_AND_RAG.md` | Thiết kế kỹ thuật chi tiết AI Shopping Assistant & RAG (cho Bạn 1 & Bạn 2) |
| `docs/ticket.md` | Thiết kế kỹ thuật chi tiết Hệ thống Ticket CSKH Thông minh (cho Bạn 3) |

### Mục tiêu 2 tuần

Cuối tuần 2, hệ thống hoàn chỉnh cần đạt được:
1. ✅ Khách hàng chat với AI để tư vấn mua sắm, tìm sản phẩm, thao tác giỏ hàng/đơn hàng.
2. ✅ AI trả lời câu hỏi chính sách dựa trên RAG Knowledge Base.
3. ✅ Khách hàng gửi ticket khiếu nại qua form hoặc AI tự động chuyển tiếp khi phát hiện bức xúc.
4. ✅ AI tự phân tích cảm xúc, xếp hạng ưu tiên, soạn draft câu trả lời.
5. ✅ Nhân viên CSKH review, chỉnh sửa draft AI, duyệt & gửi email cho khách.

---

## TUẦN 1: XÂY DỰNG NỀN TẢNG (Song song 3 người)

### 📅 Ngày 1 (Thứ 2) — KICK-OFF & SETUP CHUNG

> **Buổi sáng: Họp nhóm 30 phút — Chốt API Contract**

Cả 3 người cùng thống nhất:

| Contract | Giữa | Chi tiết cần chốt |
|---|---|---|
| **SSE Stream Format** | Bạn 1 ↔ Bạn 2 | Format SSE event: `data: {"type": "text_chunk", "content": "..."}` vs `data: {"type": "metadata", "payload": {...}}` |
| **Product Card metadata** | Bạn 1 ↔ Bạn 2 | Schema JSON `metadata` cho Product Cards & Comparison Table (xem Mục 5.2-5.3 trong AI_SHOPPING_ASSISTANT_AND_RAG.md) |
| **RAG Query API** | Bạn 1 ↔ Bạn 3 | `GET /api/ai/rag/query` — Request/Response format (xem Mục 10.2 trong ticket.md) |
| **Escalate API** | Bạn 1 ↔ Bạn 3 | `POST /api/support/tickets/escalate` — Payload khi AI Chat tự động tạo ticket (xem Mục 6.2 trong ticket.md) |

> **Buổi chiều: Mỗi người setup riêng**

| Bạn 1 | Bạn 2 | Bạn 3 |
|---|---|---|
| Scaffold `backend/ai-service` (Express + TypeScript + Prisma) | Tạo Mock SSE Server đơn giản (để code UI trước khi Backend xong) | Scaffold `backend/support-service` (Express + TypeScript + Prisma) |
| Tạo schema `ai_db`: `chat_sessions`, `chat_messages`, `knowledge_documents`, `document_chunks` | Nghiên cứu SSE EventSource API trên React | Tạo schema `support_db`: `tickets`, `ticket_messages`, `ticket_responses` |
| Thêm `ai-service` vào `docker-compose.yml` | — | Thêm `support-service` vào `docker-compose.yml` |
| Thêm route `/ai` vào `api-gateway` | — | Thêm route `/support` vào `api-gateway` |

---

### 📅 Ngày 2-3 (Thứ 3-4)

| Bạn 1 | Bạn 2 | Bạn 3 |
|---|---|---|
| **Tích hợp LLM Provider** (OpenAI/Gemini SDK) | **Xây dựng Chat Widget** | **CRUD Ticket API** |
| Cấu hình API key, retry logic, error handling | Layout: Floating Action Button góc phải dưới | `POST /api/support/tickets` — Tạo ticket mới |
| Viết module `llm-orchestrator.ts` | Click mở → cửa sổ chat (bubble messages) | `GET /api/support/tickets` — Danh sách ticket của khách |
| Test: gọi LLM thành công, nhận response | Header, input box, nút gửi | `GET /api/support/tickets/:id` — Chi tiết ticket |
| **Xây dựng RAG Pipeline** | **Responsive**: Mobile = fullscreen overlay | `POST /api/support/tickets/:id/messages` — Gửi message |
| Ingestion script: đọc file .md/.txt → chunking (200-500 từ, overlap 50 từ) → embedding (text-embedding-3-small) → lưu pgvector | Typing indicator, auto-scroll | Tạo module sinh `ticket_number` (TK-YYYYMMDD-XXX) |
| Viết endpoint `GET /api/ai/rag/query` ← **(Bạn 3 cần dùng)** | — | — |

---

### 📅 Ngày 4-5 (Thứ 5-6)

| Bạn 1 | Bạn 2 | Bạn 3 |
|---|---|---|
| **Nạp dữ liệu Knowledge Base** | **Kết nối SSE Streaming** | **AI Sentiment Analyzer** |
| Chuẩn bị 6 file chính sách (đổi trả, bảo hành, vận chuyển, thanh toán, hủy đơn, quy chế) | Tích hợp EventSource API | Tích hợp LLM SDK (OpenAI/Gemini) vào `support-service` |
| Chạy ingestion script → embed toàn bộ → lưu pgvector | Render text theo từng chunk (hiệu ứng chữ chạy) | Viết Prompt phân tích cảm xúc (→ JSON: sentiment, score, priority, category, summary) |
| Test: RAG query trả về chunk chính xác | Phân biệt message type: text vs metadata | Implement luồng tự động: ticket OPEN → ANALYZING → gọi LLM → lưu kết quả → PENDING_REVIEW |
| **Implement Tool: search_products, get_product_details** | **Render Product Action Cards** | **Implement Escalate API** |
| Gọi `catalog-service` API | Card: ảnh, tên, giá (gạch nếu giảm), nút "Xem chi tiết", nút "Thêm giỏ" | `POST /api/support/tickets/escalate` ← endpoint nhận ticket từ `ai-service` |
| Xử lý kết quả, format metadata JSON | Nút "Xem chi tiết" → navigate `/product/:slug` | Test: gửi nội dung giận dữ → AI phân tích đúng P1/ANGRY |

---

### 📅 Cuối Tuần 1 — CHECKPOINT #1

**Mỗi người demo 5 phút:**

| Bạn 1 demo | Bạn 2 demo | Bạn 3 demo |
|---|---|---|
| ✅ RAG query chính sách chạy đúng | ✅ Chat Widget mở/đóng, responsive | ✅ Tạo ticket → AI phân tích sentiment đúng |
| ✅ search_products trả về kết quả | ✅ SSE streaming text chạy mượt | ✅ Escalate API nhận ticket từ bên ngoài |
| ✅ LLM trả lời kết hợp RAG context | ✅ Product Cards render đẹp | ✅ Ticket tự động chuyển PENDING_REVIEW |

**Kiểm tra điểm giao tiếp:**
- Bạn 3 gọi thử `GET /api/ai/rag/query` của Bạn 1 → nhận về chunk chính sách ✅
- Bạn 2 nhận SSE stream từ Bạn 1 → render text + metadata ✅

---

## TUẦN 2: HOÀN THIỆN & TÍCH HỢP

### 📅 Ngày 6-7 (Thứ 2-3)

| Bạn 1 | Bạn 2 | Bạn 3 |
|---|---|---|
| **Implement Tools còn lại (Cart)** | **Render Comparison Table** | **RAG Auto-Draft** |
| `add_to_cart`, `update_cart_item`, `remove_cart_item`, `get_cart` | Bảng so sánh 2-4 sản phẩm từ metadata | Gọi `ai-service` RAG API → lấy chunk chính sách liên quan |
| Xử lý kiểm tra JWT (`x-user-id`) trước khi gọi Cart API | Highlight ưu/nhược điểm mỗi sản phẩm | Ghép RAG context + sentiment → gọi LLM soạn email draft |
| **Implement Tools còn lại (Order)** | **Quản lý Session Chat** | Lưu draft vào `ticket_responses` (ai_draft, rag_chunks_used, ai_confidence) |
| `get_orders`, `get_order_detail`, `cancel_order` | LocalStorage cho Guest session token | Test: ticket "hoàn tiền" → AI lấy đúng chính sách → soạn draft hợp lý |
| `check_promotions` | Lưu/load lịch sử chat | — |

---

### 📅 Ngày 8-9 (Thứ 4-5)

| Bạn 1 | Bạn 2 | Bạn 3 |
|---|---|---|
| **Implement xác nhận 2 bước** (cancel_order) | **Tích hợp thật với Bạn 1** | **Human-in-the-loop API + Frontend bắt đầu** |
| AI hỏi xác nhận trước khi gọi cancel | Thay Mock SSE bằng endpoint thật `/api/ai/chat` | API Staff: xem danh sách ticket, xem chi tiết + AI draft |
| Hướng dẫn đăng nhập khi Guest yêu cầu thao tác giỏ/đơn | Test E2E: hỏi sản phẩm → nhận Product Cards thật | API: chỉnh sửa draft, duyệt & gửi email (RabbitMQ → notification-service) |
| **Implement Tool `escalate_to_ticket`** ← **(cho Bạn 3)** | Test E2E: thêm giỏ hàng qua chat | API: từ chối draft → yêu cầu AI viết lại |
| Gọi `POST support-service:3009/api/support/tickets/escalate` | Test E2E: tra cứu đơn hàng qua chat | **Bắt đầu Frontend trang khách hàng** |
| — | — | Form gửi ticket `/support/new-ticket` |
| — | — | Danh sách ticket `/support/my-tickets` |

---

### 📅 Ngày 10-11 (Thứ 6-7)

| Bạn 1 | Bạn 2 | Bạn 3 |
|---|---|---|
| **Polish & Edge Cases** | **Polish UI** | **Agent Dashboard** |
| Xử lý error graceful (LLM timeout, API service down) | Animation mở/đóng chat widget | Trang `/admin/tickets` — Bảng danh sách (sort P1→P4, filter, search) |
| Rate limiting cho chat API | Loading states, error states | Badge màu cho Sentiment (🔴🟠🟡🟢), Priority (P1-P4) |
| Giới hạn context window (10 messages gần nhất) | Empty states ("Chưa có cuộc hội thoại nào") | Trang `/admin/tickets/:id` — Layout 2 cột |
| Cập nhật `docker-compose.yml` final | Mobile optimization | Cột trái: info ticket, AI analysis (score bar), timeline messages |
| — | — | Cột phải: AI Draft, Confidence bar, khung chỉnh sửa, nút "Duyệt & Gửi" |

---

### 📅 Ngày 12-13 (Thứ 2-3 Tuần 3, hoặc cuối tuần nếu dồn)

| Bạn 1 | Bạn 2 | Bạn 3 |
|---|---|---|
| **Hỗ trợ tích hợp** | **Hỗ trợ tích hợp** | **Tích hợp End-to-End** |
| Fix bug phát sinh từ integration | Fix bug UI phát sinh | Kết nối `support-service` ↔ `ai-service` RAG API thật |
| Đảm bảo Tool `escalate_to_ticket` hoạt động trơn tru | Thêm route `/support/*` và `/admin/tickets/*` vào React Router | Kết nối "Duyệt & Gửi" → `notification-service` gửi email thật |
| — | — | Test AI Chat escalate → Ticket tự tạo → AI phân tích → Draft soạn → Nhân viên duyệt → Email gửi |

---

### 📅 Ngày 14 (Thứ 4) — TỔNG KIỂM THỬ & DEMO

> **Buổi sáng: Test E2E toàn bộ hệ thống**

**Kịch bản test 1 — Happy Path AI Shopping:**
```
Khách hỏi "Tìm điện thoại dưới 15 triệu"
→ AI gọi search_products → trả về Product Cards
→ Khách hỏi "So sánh iPhone 15 và Samsung S24"
→ AI trả về Comparison Table
→ Khách nói "Thêm iPhone 15 vào giỏ"
→ AI gọi add_to_cart → xác nhận thành công
```

**Kịch bản test 2 — AI Chat Escalate to Ticket:**
```
Khách hỏi "Đơn hàng 5 ngày chưa giao, các bạn lừa đảo à?"
→ AI nhận diện khách bức xúc
→ AI gọi escalate_to_ticket → tạo ticket P1/ANGRY
→ AI phản hồi khách: "Em đã chuyển cho CSKH xử lý..."
→ Nhân viên vào Dashboard → thấy ticket P1 đỏ
→ Đọc AI Draft → sửa nhẹ → bấm Duyệt & Gửi
→ Khách nhận email phản hồi
```

**Kịch bản test 3 — Form Ticket thủ công:**
```
Khách vào /support/new-ticket → điền form khiếu nại
→ AI phân tích: FRUSTRATED, P2, category: REFUND
→ AI soạn draft trả lời viện dẫn chính sách đổi trả
→ Nhân viên vào Dashboard → review → duyệt gửi
```

**Kịch bản test 4 — RAG Chính sách:**
```
Khách hỏi "Chính sách đổi trả hàng như thế nào?"
→ AI lấy RAG context → trả lời chính xác
Khách hỏi "Sàn có bán vũ khí không?"
→ AI: "Xin lỗi, tôi không tìm thấy thông tin..."
```

> **Buổi chiều: Demo nội bộ & Fix bug cuối**

---

## GANTT CHART TỔNG QUAN

```
         Ngày 1    2    3    4    5    6    7    8    9    10   11   12   13   14
         ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
Bạn 1    │SETUP│ LLM + RAG Pipeline  │Tools│Tools│ Tools  │Escalate│Polish│ FIX│
(Backend)│    │ Ingestion, Embedding │Srch │Cart │Order   │Tool   │Edge  │ BUG│
         │    │ RAG Query API ★      │Prod │     │Cancel  │  ★    │Cases │    │
         ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
Bạn 2    │SETUP│ Chat Widget Layout  │ SSE │Cards│Compare│ Tích hợp thật  │ FIX│
(Front)  │Mock │ Floating, Responsive│Strm │Prod │Table  │ với Bạn 1     │ BUG│
         │SSE  │ Typing indicator    │     │Card │Session│ Test E2E       │    │
         ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
Bạn 3    │SETUP│ CRUD Ticket API     │AI   │RAG  │HITL  │ FE Ticket Form │E2E │
(Ticket) │    │ Ticket Number Gen   │Sent.│Auto │API   │ Agent Dashboard │TEST│
         │    │ Escalate API ★      │Anal.│Draft│Email │ 2-col Detail   │DEMO│
         └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
         
         ★ = Điểm giao tiếp (API Contract) giữa các thành viên
         ├──── TUẦN 1: NỀN TẢNG ────┤├──── TUẦN 2: HOÀN THIỆN & TÍCH HỢP ────┤
```

---

## ĐIỂM GIAO TIẾP & PHỤ THUỘC

### Sơ đồ phụ thuộc

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Bạn 1 (ai-service)                                            │
│   ┌──────────────────────┐     ┌──────────────────────────┐     │
│   │ RAG Query API        │────→│ Bạn 3 gọi để lấy chunk  │     │
│   │ GET /api/ai/rag/query│     │ chính sách cho Draft     │     │
│   │ ★ Cần xong Ngày 3   │     │ (Bắt đầu dùng từ Ngày 6)│     │
│   └──────────────────────┘     └──────────────────────────┘     │
│                                                                  │
│   ┌──────────────────────┐     ┌──────────────────────────┐     │
│   │ SSE Stream API       │────→│ Bạn 2 consume stream     │     │
│   │ POST /api/ai/chat    │     │ để render UI chat        │     │
│   │ ★ Cần xong Ngày 4   │     │ (Bắt đầu dùng từ Ngày 8)│     │
│   └──────────────────────┘     └──────────────────────────┘     │
│                                                                  │
│   ┌──────────────────────┐     ┌──────────────────────────┐     │
│   │ Tool escalate_to_    │────→│ Bạn 3 nhận ticket từ     │     │
│   │ ticket               │     │ AI Chat                  │     │
│   │ ★ Cần xong Ngày 8   │     │ (Bắt đầu dùng từ Ngày 12│     │
│   └──────────────────────┘     └──────────────────────────┘     │
│                                                                  │
│   Bạn 3 (support-service)                                       │
│   ┌──────────────────────┐     ┌──────────────────────────┐     │
│   │ Escalate API         │────→│ Bạn 1 gọi khi AI phát   │     │
│   │ POST /tickets/       │     │ hiện khách bức xúc       │     │
│   │ escalate             │     │                          │     │
│   │ ★ Cần xong Ngày 4   │     │ (Bạn 1 dùng từ Ngày 8)  │     │
│   └──────────────────────┘     └──────────────────────────┘     │
│                                                                  │
│   Bạn 2 (Frontend)                                              │
│   ┌──────────────────────┐                                      │
│   │ Thêm route /support  │                                      │
│   │ và /admin/tickets    │                                      │
│   │ ★ Cần phối hợp       │                                      │
│   │   Ngày 12-13         │                                      │
│   └──────────────────────┘                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Chiến lược giảm Block (chờ đợi)

| Tình huống Block | Giải pháp |
|---|---|
| Bạn 2 cần SSE từ Bạn 1 nhưng Bạn 1 chưa xong | Bạn 2 tạo **Mock SSE Server** ngay Ngày 1 để code UI độc lập |
| Bạn 3 cần RAG API từ Bạn 1 nhưng Bạn 1 chưa xong | Bạn 3 tạo **Mock RAG Response** (hardcode JSON chunk) để test Draft Generator trước |
| Bạn 1 cần Escalate API từ Bạn 3 nhưng Bạn 3 chưa xong | Bạn 1 implement Tool `escalate_to_ticket` với try-catch, log lỗi nếu service chưa sẵn sàng |

---

## RỦI RO & BIỆN PHÁP XỬ LÝ

| Rủi ro | Xác suất | Tác động | Biện pháp |
|---|---|---|---|
| OpenAI API bị rate limit hoặc downtime | Trung bình | Cao | Cấu hình fallback: OpenAI → Gemini. Retry với exponential backoff |
| RAG trả về chunk không liên quan | Trung bình | Trung bình | Đặt ngưỡng score tối thiểu (VD: chỉ lấy chunk có score ≥ 0.7). AI Confidence sẽ thấp → cảnh báo nhân viên |
| Tích hợp E2E phát sinh nhiều bug | Cao | Trung bình | Dành 2 ngày cuối (Ngày 12-14) chuyên cho integration. Mock trước, tích hợp thật sau |
| Thiếu thời gian cho Frontend polish | Trung bình | Thấp | Ưu tiên chức năng hoạt động đúng trước, UI đẹp sau. Agent Dashboard cần hoạt động đúng hơn cần đẹp |

---

## CHECKLIST HOÀN THÀNH

### Bạn 1 — ai-service
- [ ] `ai-service` chạy trong Docker, port 3008
- [ ] RAG Pipeline: Ingestion + Embedding + pgvector query hoạt động
- [ ] 6 file chính sách được nạp vào Knowledge Base
- [ ] 12 Tools hoạt động: search, detail, cart (add/update/remove/get), order (list/detail/cancel), promotions, compare, RAG search
- [ ] SSE streaming response hoạt động
- [ ] Tool `escalate_to_ticket` gọi sang `support-service`
- [ ] Xác nhận 2 bước cho `cancel_order`
- [ ] Endpoint `GET /api/ai/rag/query` public cho Bạn 3

### Bạn 2 — Frontend Chat
- [ ] Chat Widget: Floating button, mở/đóng, responsive (mobile fullscreen)
- [ ] SSE streaming: text chạy realtime
- [ ] Product Action Cards: ảnh, giá, nút xem chi tiết, nút thêm giỏ
- [ ] Comparison Table: bảng so sánh 2-4 sản phẩm
- [ ] Session management: Guest (LocalStorage) + User đăng nhập
- [ ] Thêm route `/support/*` và `/admin/tickets/*` vào React Router (phối hợp Bạn 3)

### Bạn 3 — support-service + Ticket UI
- [ ] `support-service` chạy trong Docker, port 3009
- [ ] CRUD Ticket API hoạt động (tạo, xem, cập nhật)
- [ ] AI Sentiment Analyzer: phân tích cảm xúc → JSON (sentiment, score, priority)
- [ ] RAG Auto-Draft: gọi RAG API → soạn email draft tự động
- [ ] Escalate API: nhận ticket từ `ai-service`
- [ ] Human-in-the-loop API: xem draft, sửa draft, duyệt & gửi email
- [ ] Frontend: Form gửi ticket `/support/new-ticket`
- [ ] Frontend: Danh sách ticket `/support/my-tickets`
- [ ] Frontend: Agent Dashboard `/admin/tickets` (bảng, sort, filter)
- [ ] Frontend: Chi tiết ticket `/admin/tickets/:id` (2 cột, AI analysis, draft editor, nút duyệt)
- [ ] Gửi email qua `notification-service` (RabbitMQ)
