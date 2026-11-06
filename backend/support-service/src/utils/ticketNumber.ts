import { prisma } from "../config/prisma";

/**
 * Sinh mã Ticket theo định dạng TK-YYYYMMDD-XXX (Ví dụ: TK-20261105-001)
 */
export async function generateTicketNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  const startOfDay = new Date(year, now.getMonth(), now.getDate());
  const endOfDay = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Đếm số ticket đã tạo trong ngày hiện tại
  const countToday = await prisma.ticket.count({
    where: {
      created_at: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  const sequence = String(countToday + 1).padStart(3, "0");
  return `TK-${dateStr}-${sequence}`;
}

