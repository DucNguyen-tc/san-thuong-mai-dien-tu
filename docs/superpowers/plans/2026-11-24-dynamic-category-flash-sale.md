# Dynamic Category-Based Flash Sale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn FlashSaleSection into a dynamic database-driven component that randomly selects an active promotion from catalog_db, computes the real countdown timer until `valid_to`, and displays ~10 randomized products in a horizontal carousel.

**Architecture:** 
1. Populate category-specific promotions in `catalog_db` (Điện tử, Thời trang, Sức khỏe & Làm đẹp, Nhà cửa & Đời sống) with valid date ranges and associated items.
2. Provide frontend `promotionService.ts` to fetch active promotions.
3. Update `FlashSaleSection.tsx` to randomly pick an active promotion, run real countdown timer to `valid_to`, load 10-12 shuffled products from that promotion/category, and render them in a responsive horizontal carousel with left/right scroll controls.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide icons, PostgreSQL (`catalog_db`), Vite.

## Global Constraints
- Do not introduce new external npm packages.
- Timer must calculate hours/minutes/seconds from `Date.now()` to `valid_to`.
- Product prices must calculate real sale prices using `discount_value` and `discount_type`.
- Navigation must route to `/products/${slug || id}` and `/products?category_id=${cat_id}&has_discount=true`.

---

### Task 1: Seed Category-Specific Active Promotions in `catalog_db`

**Files:**
- Create: `backend/catalog-service/prisma/seed_category_promotions.ts`

**Interfaces:**
- Consumes: PostgreSQL `catalog_db` connection, `promotions` and `promotion_items` tables.
- Produces: 4 distinct category-scoped promotions with active dates (`valid_from <= now`, `valid_to >= now + 2..5 days`).

- [ ] **Step 1: Write and run `seed_category_promotions.ts`**
  - Create promotions:
    - `TECH-FLASH-SALE`: "Flash Sale Đột Phá Công Nghệ" (30%, 3 days)
    - `FASHION-FLASH-SALE`: "Siêu Hội Thời Trang Xu Hướng" (40%, 2 days)
    - `BEAUTY-FLASH-SALE`: "Đại Tiệc Nước Hoa & Mỹ Phẩm" (50%, 4 days)
    - `HOME-FLASH-SALE`: "Bão Deal Nhà Cửa & Đời Sống" (25%, 5 days)
  - Map each category's products to `promotion_items`.
  - Execute the script and verify records exist in `catalog_db`.

---

### Task 2: Create Promotion Service in Frontend

**Files:**
- Create: `frontend/src/services/promotionService.ts`
- Modify: `frontend/src/types/catalog.ts` (if needed for Promotion types)

**Interfaces:**
- Consumes: `apiClient` from `@/lib/api-client`, `Promotion` from `@/types/catalog`
- Produces: `getActivePromotions(): Promise<Promotion[]>`

- [ ] **Step 1: Implement `frontend/src/services/promotionService.ts`**
  - Export `getPromotions()` which queries `GET /catalog/promotions`.
  - Export `getActivePromotions()` which filters for `is_active === true && new Date(valid_to) > new Date()`.

---

### Task 3: Refactor `FlashSaleSection.tsx` with Dynamic Data & Carousel

**Files:**
- Modify: `frontend/src/components/home/FlashSaleSection.tsx`

**Interfaces:**
- Consumes: `getActivePromotions()` from `@/services/promotionService`, `getProducts()` from `@/services/productService`.
- Produces: Dynamic Flash Sale Section with Carousel UI, real timer, and randomized promotion products.

- [ ] **Step 1: Update component logic**
  - Fetch active promotions, pick 1 randomly.
  - Calculate real remaining hours, minutes, seconds until `valid_to`. Set interval to tick every second.
  - Fetch products from selected category (or with promotions), shuffle array, take 10-12 products.
  - Compute accurate discount percent, sale price, and original price.
- [ ] **Step 2: Update JSX to Horizontal Carousel (Option A)**
  - Implement container with `useRef<HTMLDivElement>`, `scroll('left')` and `scroll('right')` functions.
  - Add `<ChevronLeft>` and `<ChevronRight>` control buttons in header.
  - Render product cards with fixed min-width (`min-w-[240px] md:min-w-[270px]`) inside flex container with `overflow-x-auto hide-scrollbar scroll-smooth`.
  - Update header badge to show promotion name and discount percentage.

---

### Task 4: Verification & Build Check

**Files:**
- Verify: `frontend/src/components/home/FlashSaleSection.tsx`
- Verify: `frontend/src/services/promotionService.ts`

- [ ] **Step 1: Run TypeScript check (`npx tsc --noEmit`)**
- [ ] **Step 2: Run Vite production build (`npm run build`)**

