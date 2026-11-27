# Header Category Mega Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the category grid from the homepage body into an elegant 2-column Mega Menu right next to the V-Shop logo in the Header.

**Architecture:** Create an isolated `CategoryMegaMenu` component that fetches category tree data via `getCategoryTree()`, filters out empty duplicate roots, and presents a 2-column layout (Left: Parent categories with icons; Right: Grid of subcategories). Integrate it into `Header.tsx` right next to the Logo with click-to-toggle, click-outside, and Escape key listeners. Remove `CategoryGrid` from `Home.tsx`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide icons (`lucide-react`), React Router DOM (`useNavigate`, `Link`).

## Global Constraints
- Do not introduce new external npm packages.
- Maintain existing responsive header styling.
- Navigation links must route to `/products?category_id=${id}`.
- Clicking any category link or clicking outside must close the menu.

---

### Task 1: Create CategoryMegaMenu Component

**Files:**
- Create: `frontend/src/components/layout/CategoryMegaMenu.tsx`

**Interfaces:**
- Consumes: `getCategoryTree()` from `@/services/categoryService`, `Category` from `@/types/catalog`
- Props: `{ isOpen: boolean; onClose: () => void }`

- [ ] **Step 1: Write `CategoryMegaMenu.tsx`**
  - Implement Lucide icon mapping for parent categories.
  - Implement fetch of category tree on mount with loading skeleton.
  - Filter roots to ensure only valid non-empty categories appear.
  - Active parent category state (defaults to first category, changes on hover or click).
  - Left column: Parent categories list with icons and `ChevronRight`.
  - Right column: Header with parent link, and responsive grid of subcategories.
  - Navigation handler that invokes `onClose()` before navigating.

---

### Task 2: Integrate Mega Menu in Header.tsx

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx`

**Interfaces:**
- Consumes: `CategoryMegaMenu` from `./CategoryMegaMenu`
- Produces: Hamburger menu button next to logo triggering `CategoryMegaMenu`.

- [ ] **Step 1: Add state and button next to Logo in `Header.tsx`**
  - Add `isCategoryMenuOpen` state in `Header.tsx`.
  - Add hamburger button with `Menu` icon and `ChevronDown` right after the V-Shop logo.
  - Wrap Logo and Menu button in a relative container so the dropdown positions correctly.
  - Add click-outside and Escape key handling for the category menu.

---

### Task 3: Remove CategoryGrid from Home.tsx

**Files:**
- Modify: `frontend/src/pages/user/Home.tsx`

- [ ] **Step 1: Remove `<CategoryGrid />` import and JSX from `Home.tsx`**
  - Clean up unused import.
  - Verify layout flow between `TrustBadges` and `FlashSaleSection`.

---

### Task 4: Verification & Build Check

**Files:**
- Verify: `frontend/src/components/layout/Header.tsx`
- Verify: `frontend/src/components/layout/CategoryMegaMenu.tsx`
- Verify: `frontend/src/pages/user/Home.tsx`

- [ ] **Step 1: Run TypeScript check on frontend**
  - Execute `npm run build` or `npx tsc --noEmit` in `frontend`.
- [ ] **Step 2: Confirm end-to-end user experience**

