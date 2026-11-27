# Design Spec: Header Category Mega Menu

- **Date:** 2026-11-24
- **Topic:** Move Homepage Category Grid to a Header Mega Menu near the Logo
- **Status:** Approved

## 1. Problem Statement & Motivation
Currently, the "Danh mục nổi bật" (Category Grid) is placed in the body of the homepage (`Home.tsx`). It has two major issues:
1. Takes up prominent vertical screen estate on the homepage while duplicating category roots (due to stale/empty category entries in the database).
2. It is not accessible when browsing other pages (e.g., search results, product details, cart, profile).

The user requested moving the category navigation up next to the Logo in the Header as a 3-stripe hamburger button ("Dấu 3 gạch") that, when clicked, opens a category menu allowing users to explore and select subcategories ("category con").

## 2. Proposed Architecture & UI Design

### 2.1 Header Placement (`frontend/src/components/layout/Header.tsx`)
- Placed immediately to the right of the `V-Shop` Logo.
- A button component:
  - Icon: Hamburger `Menu` icon (`lucide-react`, 20px).
  - Text: `Danh mục` (font-medium, text-sm).
  - Icon: `ChevronDown` (14px, rotates 180 degrees when open).
  - Styling: Rounded-full or rounded-xl button, subtle hover state (`hover:bg-surface-container`), focus ring.
  - Interactive behavior:
    - Click toggles the Mega Menu open/closed.
    - Click-outside closes the Mega Menu.
    - Pressing Escape closes the Mega Menu.

### 2.2 Category Mega Menu Component (`frontend/src/components/layout/CategoryMegaMenu.tsx`)
- Positioned absolutely below the button: `top-full left-0 mt-2 z-[60]`.
- Floating card design:
  - Dimensions: Width ~700px, Min-height ~380px, Max-height ~480px.
  - Background: White (`bg-white`), Border: `border border-gray-100`, Shadow: `shadow-2xl rounded-2xl`.
  - Layout: Two-column grid (`flex flex-row divide-x divide-gray-100 overflow-hidden`).
- **Left Column: Parent Categories (width ~240px)**
  - Background: `bg-slate-50/70`.
  - Displays list of root categories.
  - Each item: Icon (mapped based on category name) + Name + `ChevronRight`.
  - Active state: Highlighted with blue background / primary text when hovered or selected.
  - Hovering over a parent category immediately updates the right column to show its children.
- **Right Column: Subcategories (flex-1)**
  - Top header: Shows active parent category name + a link "Xem tất cả [Tên danh mục cha] →" navigating to `/products?category_id=${parent.id}`.
  - Subcategory grid: 2 or 3 columns of clickable subcategory links.
  - Each link: Icon or dot, subcategory name, hover highlight (`hover:text-primary hover:bg-primary-fixed/30`).
  - Clicking any subcategory or parent link closes the Mega Menu and navigates to `/products?category_id=${id}`.
- **Loading State:**
  - Skeleton placeholders for left and right columns while `getCategoryTree()` is loading.

### 2.3 Data Hygiene & Category Filtering
- The backend `getCategoryTree()` returns 11 root categories, 5 of which were legacy duplicates with invalid slugs and 0 children (e.g. `-i-n-t-`, `th-i-trang`).
- The frontend component will filter root categories:
  ```ts
  const validRoots = tree.filter(cat => (cat.children && cat.children.length > 0) || cat.slug === 'khac');
  ```
  This ensures only clean, rich categories (Điện tử, Thời trang, Sức khỏe & Làm đẹp, Nhà cửa & Đời sống, Thể thao & Xe, Khác) appear in the menu.

### 2.4 Homepage Update (`frontend/src/pages/user/Home.tsx`)
- Remove `<CategoryGrid />` from `Home.tsx`.
- The space between `<TrustBadges />` and `<FlashSaleSection />` will flow naturally, keeping the page clean and focused on featured deals and AI recommendations.

## 3. Success Criteria
1. Hamburger menu button appears next to `V-Shop` Logo in the Header.
2. Clicking the button opens the 2-column Mega Menu smoothly.
3. Left column displays main categories with appropriate icons.
4. Hovering a main category dynamically displays its subcategories in the right column.
5. Clicking any subcategory navigates to `/products?category_id=<sub_id>` and closes the dropdown.
6. Clicking outside or pressing Escape closes the dropdown.
7. Homepage no longer displays the old CategoryGrid section.
8. No visual regression or TypeScript errors in `frontend`.

