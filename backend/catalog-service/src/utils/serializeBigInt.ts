/**
 * serializeBigInt — Chuyển đệ quy mọi giá trị BigInt trong object/array
 * sang string, vì JSON.stringify gốc không tự xử lý được BigInt
 * (bảng product_images.id, promotion_items.id, stock_reservations.id
 * dùng BIGSERIAL -> Prisma map thành BigInt).
 *
 * Theo quy định bắt buộc tại backend/AGENT.md mục 3.2.
 */
export function serializeBigInt<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => (typeof val === 'bigint' ? val.toString() : val))
  );
}
