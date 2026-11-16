/**
 * serializeDecimal — Chuyển đệ quy các giá trị BigInt và Decimal (Prisma)
 * sang string/number khi trả JSON response, tuân thủ AGENT.md mục 3.2.
 */
export function serializeDecimal<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (typeof val === 'bigint') {
        return val.toString();
      }
      // Kiểm tra nếu là Prisma Decimal object
      if (val && typeof val === 'object' && 's' in val && 'e' in val && 'd' in val) {
        return Number(val);
      }
      return val;
    })
  );
}
