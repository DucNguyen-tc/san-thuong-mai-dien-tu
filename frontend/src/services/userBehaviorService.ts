/**
 * userBehaviorService.ts
 * Quản lý lịch sử hành vi người dùng lưu trong localStorage.
 * Dùng để cá nhân hóa khối "Sản phẩm dành riêng cho bạn" ở trang chủ.
 *
 * Lược đồ dữ liệu (key: "user_view_history"):
 * [{ productId, categoryId, categoryName, viewedAt }]
 *
 * Không cần server — hoạt động 100% trên trình duyệt.
 */

const STORAGE_KEY = 'user_view_history';
const MAX_HISTORY = 20; // Giữ tối đa 20 sản phẩm, xoay vòng FIFO
const FOCUSED_THRESHOLD = 0.7; // ≥70% cùng category → "tập trung"
const RECENT_WINDOW = 5; // Phân tích 5 sản phẩm gần nhất để quyết định chiến lược

export interface ViewHistoryItem {
  productId: string;
  categoryId: string;
  categoryName: string;
  viewedAt: string; // ISO string
}

/** Kiểu phân tích hành vi người dùng */
export type ViewPattern = 'empty' | 'focused' | 'diverse';

/** Kết quả phân tích lịch sử xem */
export interface ViewPatternAnalysis {
  pattern: ViewPattern;
  /** ID sản phẩm xem gần nhất (dùng để gọi /recommendations/:id) */
  topProductIds: string[];
  /** Category chiếm đa số (chỉ có khi pattern = 'focused') */
  dominantCategoryName?: string;
}

/**
 * Ghi lại hành vi xem sản phẩm vào localStorage.
 * Tự động loại bỏ bản ghi cũ của cùng sản phẩm (tránh trùng lặp),
 * đẩy sản phẩm mới nhất lên đầu.
 */
export function recordProductView(
  productId: string,
  categoryId: string,
  categoryName: string
): void {
  try {
    const history = getViewHistory();

    // Xóa bản ghi cũ nếu sản phẩm đã từng xem
    const filtered = history.filter((item) => item.productId !== productId);

    // Thêm bản ghi mới nhất lên đầu
    const newItem: ViewHistoryItem = {
      productId,
      categoryId,
      categoryName,
      viewedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // localStorage có thể bị vô hiệu hóa trong private browsing
    console.warn('[UserBehavior] Cannot write to localStorage', e);
  }
}

/**
 * Lấy toàn bộ lịch sử xem sản phẩm (mới nhất trước).
 */
export function getViewHistory(): ViewHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ViewHistoryItem[];
  } catch {
    return [];
  }
}

/**
 * Lấy N sản phẩm xem gần nhất.
 */
export function getRecentViews(count: number = RECENT_WINDOW): ViewHistoryItem[] {
  return getViewHistory().slice(0, count);
}

/**
 * Phân tích pattern hành vi dựa trên lịch sử gần nhất.
 *
 * Logic:
 * - Nếu không có lịch sử → 'empty'
 * - Nếu ≥70% trong 5 sp gần nhất thuộc cùng 1 category → 'focused'
 * - Ngược lại → 'diverse'
 *
 * Returns:
 * - `topProductIds`: danh sách productId để gọi recommendation API
 * - `dominantCategoryName`: tên category khi focused (để hiển thị UI)
 */
export function analyzeViewPattern(): ViewPatternAnalysis {
  const recent = getRecentViews(RECENT_WINDOW);

  if (recent.length === 0) {
    return { pattern: 'empty', topProductIds: [] };
  }

  // Đếm category distribution
  const categoryCounts = new Map<string, { count: number; name: string }>();
  for (const item of recent) {
    const existing = categoryCounts.get(item.categoryId);
    if (existing) {
      existing.count += 1;
    } else {
      categoryCounts.set(item.categoryId, { count: 1, name: item.categoryName });
    }
  }

  // Tìm category phổ biến nhất
  let maxCount = 0;
  let dominantCategoryId = '';
  let dominantCategoryName = '';
  for (const [catId, { count, name }] of categoryCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantCategoryId = catId;
      dominantCategoryName = name;
    }
  }

  const ratio = maxCount / recent.length;

  // Lấy top productIds (ưu tiên sp của category chiếm đa số, rồi đến các sp khác)
  const topProductIds = recent.map((item) => item.productId);

  if (ratio >= FOCUSED_THRESHOLD) {
    return {
      pattern: 'focused',
      topProductIds,
      dominantCategoryName,
    };
  }

  return {
    pattern: 'diverse',
    topProductIds,
  };
}

/**
 * Xóa toàn bộ lịch sử xem (dùng khi user logout).
 */
export function clearViewHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}
