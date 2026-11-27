# Design Spec: Dynamic Category-Based Flash Sale Section

- **Date:** 2026-11-24
- **Topic:** Dynamic Database-Driven Flash Sale with Category Randomization and Real Countdown
- **Status:** Approved

## 1. Problem Statement & Motivation
Currently, `FlashSaleSection.tsx`:
1. Uses a mock ticking countdown timer with hardcoded values (`02:48:35`).
2. Hardcodes a `20%` discount and calculates fake original prices (`price * 1.25`).
3. Fetches the first 4 products from the database regardless of discount status (currently rendering 4 perfumes).

The user requested:
- Pulling real promotion data from the database (`promotions` table).
- When multiple active promotions are available, pick one at random.
- Calculate and display the real countdown timer until `valid_to` of that selected promotion.
- Display the promotion's name and actual discount percent/badge.
- Pick ~10-12 random products belonging to that promotion / category.
- Display products in a smooth horizontal Carousel (Option A) with Left / Right navigation buttons.

## 2. Architecture & Design

### 2.1 Backend / Database Promotions
- We need active category-specific promotions in `catalog_db` with valid time ranges and associated products in `promotion_items`.
- Seed / create promotions for key categories:
  1. **Flash Sale Công Nghệ & Điện Tử** (Category: Điện tử - Laptop, Điện thoại, Phụ kiện...). Code: `TECH-FLASH-SALE`, Discount: 20-30%, Active: Now to +3 days.
  2. **Lễ Hội Thời Trang & Phụ Kiện** (Category: Thời trang - Áo nam, Giày nam, Túi...). Code: `FASHION-FLASH-SALE`, Discount: 35-40%, Active: Now to +2 days.
  3. **Đại Tiệc Nước Hoa & Mỹ Phẩm** (Category: Sức khỏe & Làm đẹp - Nước hoa, Chăm sóc da...). Code: `BEAUTY-FLASH-SALE`, Discount: 25-50%, Active: Now to +4 days.
  4. **Siêu Deal Nhà Cửa & Bếp** (Category: Nhà cửa & Đời sống - Gia dụng, Bếp...). Code: `HOME-FLASH-SALE`, Discount: 20-25%, Active: Now to +5 days.
- Ensure products are mapped to `promotion_items` via `addItemsByCategory` or a seeding script so `where: { promotions: { some: ... } }` or category filter queries work cleanly.

### 2.2 Frontend Service Extension (`frontend/src/services/promotionService.ts`)
- Add service methods to fetch promotions:
  - `getActivePromotions(): Promise<Promotion[]>` -> calls `GET /catalog/promotions`.
  - Filters client-side or backend for `is_active === true && new Date(valid_to) > new Date()`.
  - For products: Calls `getProducts({ category_id: promoCategoryId, limit: 20, has_discount: true })` or fetches products with promotions.

### 2.3 FlashSaleSection Component (`frontend/src/components/home/FlashSaleSection.tsx`)
- **State Management:**
  - `activePromotion`: The selected promotion object (`name`, `discount_value`, `discount_type`, `valid_to`, `id`, `code`).
  - `items`: List of 10-12 randomized flash sale products.
  - `timeLeft`: Computed remaining hours, minutes, seconds dynamically derived from `new Date(activePromotion.valid_to).getTime() - Date.now()`.
  - `isLoading`: Boolean loading indicator for data fetching.
- **Carousel UI (Option A):**
  - Container with `ref={scrollContainerRef}` and `overflow-x-auto hide-scrollbar scroll-smooth`.
  - Left & Right scroll buttons (`ChevronLeft`, `ChevronRight`) in the header bar.
  - Each item card: fixed width (~260px on desktop, ~200px on mobile) with snap scrolling.
  - Card displays:
    - Real discount tag (`-{discountPercent}%`).
    - Primary product image.
    - Product title (line-clamp-2).
    - Calculated sale price and original price based on `discount_type` and `discount_value`.
    - Sold progress bar ("Đã bán X - Còn Y suất").
    - Direct link to `/products/${slug || id}`.
- **Header Bar:**
  - Dynamic title: `FLASH SALE` + Badge with promotion name/discount (e.g. `GIẢM ĐẾN ${promo.discount_value}%` or promo name).
  - Subtitle: Dynamic date/time description.
  - Real countdown clock with `formatDigits(hours)`, `formatDigits(minutes)`, `formatDigits(seconds)`.
  - View all link: `/products?has_discount=true` (or category filter).

## 3. Success Criteria
1. When visiting the home page, an active promotion is randomly selected.
2. Countdown timer accurately reflects the real remaining time until `valid_to`.
3. 10-12 products from the selected promotion/category are loaded and randomized.
4. Carousel scrolls smoothly left and right via buttons or touch/mouse scroll.
5. Prices and discount badges match the promotion's discount configuration.
6. TypeScript build passes with zero errors.

