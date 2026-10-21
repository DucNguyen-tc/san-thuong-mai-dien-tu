# PLAN: AI Personalized Recommendation Upgrade

**Nhánh:** `feat/ai-personalized-recommendation`  
**Tài liệu gốc:** `docs/AI_PERSONALIZED_RECOMMENDATION_UPGRADE.md`

## Quyết định đã chốt

| # | Quyết định |
|---|-----------|
| D1 | Bảng mới `user_product_events` (customer_id, product_id, event_type VIEW/ADD_TO_CART, created_at) — không đụng bảng `recommendation_logs` cũ |
| D2 | PURCHASE lấy từ Order Service (gọi HTTP nội bộ), không ghi vào `user_product_events` |
| D3 | `customerId` lấy từ header `x-user-id` (gateway forward); nếu không có thì query param kèm `// TODO` |
| D4 | `CATALOG_SERVICE_URL` = `http://catalog-service:3002` (docker-compose nội bộ), gọi batch |
| D5 | Catalog **không có cột brand** → bỏ boost brand, chỉ làm price-range boost ±30% |
| D6 | `REPURCHASE_ALLOWED_CATEGORY_IDS = []` — hằng số để sau điền FMCG |
| D7 | Order Service route: `GET /api/orders` với `x-user-id` header, include items. Recommendation service gọi nội bộ |
| D8 | Timeout 3s cho mọi lời gọi sang order-service / catalog-service. Lỗi → bỏ qua, không trả 500 |
| D9 | Trọng số: PURCHASE×3, ADD_TO_CART×2, VIEW×1 |
| D10 | Cache kết quả gọi Order Service 60 giây trong bộ nhớ theo customerId |

## Các bước thực hiện

- [x] **Bước 0** — Tạo PLAN.md này
- [ ] **Bước 1** — Schema: enum `UserEventType` (VIEW, ADD_TO_CART) + bảng `user_product_events` + index; index `recommendation_logs(created_at)`; chạy `prisma migrate dev`
- [ ] **Bước 7** — `POST /recommendations/events`: nhận VIEW/ADD_TO_CART, validate, lấy customerId từ `x-user-id` header hoặc query param (TODO)
- [ ] **Bước 2** — `getPopularProducts`: thêm time window 7 ngày cho log query
- [ ] **Bước 3** — Exclude logic: sản phẩm đã mua 30 ngày (từ Order Service), trong cart (client truyền), impression>10 no-click; áp dụng cho `/popular` và `/personalized`
- [ ] **Bước 4** — `getPersonalizedFeed(customerId, limit, excludeIds)` + route `GET /recommendations/personalized`; cache 60s
- [ ] **Bước 5** — Price-range boost ±30% trong `getContentBasedProducts`; thêm route batch lấy giá vào catalog-service; thêm `CATALOG_SERVICE_URL` vào docker-compose + .env.example
- [ ] **Bước 6** — Frontend: `AIRecommendations.tsx` gọi `/personalized` khi login; log VIEW và ADD_TO_CART events

## Ghi chú kỹ thuật

- File service chính: `backend/recommendation-service/src/services/recommendation.service.ts`
- File controller: `backend/recommendation-service/src/controllers/recommendation.controller.ts`
- File routes: `backend/recommendation-service/src/routes/recommendation.routes.ts`
- Schema: `backend/recommendation-service/prisma/schema.prisma`
- Format response hiện tại: `{ success: boolean, data: string[], meta: { algorithm, count, ... } }` — KHÔNG ĐƯỢC THAY ĐỔI
