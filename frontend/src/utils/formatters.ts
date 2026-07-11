/**
 * formatPrice — Định dạng số tiền theo chuẩn tiền Việt Nam
 * @example formatPrice(26990000) → "26.990.000đ"
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'đ';
}

/**
 * formatRating — Định dạng số đánh giá
 * @example formatRating(1200) → "1.2k"
 */
export function formatRating(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return count.toString();
}
