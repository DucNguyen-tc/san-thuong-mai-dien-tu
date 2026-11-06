import { prisma } from "../config/prisma";
import { generateTicketNumber } from "../utils/ticketNumber";
import { CreateTicketInput, AddMessageInput, ListTicketsQuery } from "../schemas/ticket.schema";
import { TicketSource, TicketStatus, SenderType } from "@prisma/client";

export class TicketService {
  /**
   * Tạo ticket mới từ Form người dùng (source: FORM)
   */
  static async createTicket(
    customerId: string,
    input: CreateTicketInput,
    userEmail?: string,
    userName?: string
  ) {
    const ticketNumber = await generateTicketNumber();
    const finalEmail = input.customer_email || userEmail || "customer@example.com";
    const finalName = input.customer_name || userName || "Khách hàng";

    // Transaction tạo Ticket + Tin nhắn mở đầu
    const createdTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticket_number: ticketNumber,
          customer_id: customerId,
          customer_email: finalEmail,
          customer_name: finalName,
          subject: input.subject,
          category: input.category,
          related_order_id: input.related_order_id || null,
          source: TicketSource.FORM,
          status: TicketStatus.OPEN
        }
      });

      await tx.ticketMessage.create({
        data: {
          ticket_id: ticket.id,
          sender_type: SenderType.CUSTOMER,
          sender_id: customerId,
          content: input.content,
          attachments: input.attachments || []
        }
      });

      return ticket;
    });

    return createdTicket;
  }

  /**
   * Lấy danh sách ticket của một khách hàng (có phân trang & lọc status)
   */
  static async getUserTickets(customerId: string, query: ListTicketsQuery) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      customer_id: customerId,
      ...(status ? { status } : {})
    };

    const [total, items] = await Promise.all([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          _count: {
            select: { messages: true }
          }
        }
      })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Lấy chi tiết ticket theo ID (kèm messages và responses đã được duyệt)
   */
  static async getTicketById(ticketId: string, customerId: string, userRole: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { created_at: "asc" }
        },
        responses: {
          where: userRole === "CUSTOMER" ? { review_status: "APPROVED" } : undefined,
          orderBy: { created_at: "asc" }
        }
      }
    });

    if (!ticket) {
      throw new Error("Không tìm thấy ticket yêu cầu");
    }

    // Nếu là Customer thì chỉ được xem ticket của chính mình
    if (userRole === "CUSTOMER" && ticket.customer_id !== customerId) {
      throw new Error("Bạn không có quyền truy cập ticket này");
    }

    return ticket;
  }

  /**
   * Gửi tin nhắn phản hồi / bổ sung vào ticket
   */
  static async addMessage(
    ticketId: string,
    senderId: string,
    userRole: string,
    input: AddMessageInput
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error("Không tìm thấy ticket yêu cầu");
    }

    // Kiểm tra quyền
    if (userRole === "CUSTOMER" && ticket.customer_id !== senderId) {
      throw new Error("Bạn không có quyền gửi tin nhắn trong ticket này");
    }

    const senderType = userRole === "CUSTOMER" ? SenderType.CUSTOMER : SenderType.STAFF;

    // Transaction lưu message + cập nhật status nếu cần
    const message = await prisma.$transaction(async (tx) => {
      const newMsg = await tx.ticketMessage.create({
        data: {
          ticket_id: ticketId,
          sender_type: senderType,
          sender_id: senderId,
          content: input.content,
          attachments: input.attachments || []
        }
      });

      // Nếu khách phản hồi lại một ticket đã được phản hồi (RESPONDED) hoặc đóng (RESOLVED)
      // thì tự động chuyển sang REOPENED theo State Machine
      if (
        senderType === SenderType.CUSTOMER &&
        (ticket.status === TicketStatus.RESPONDED || ticket.status === TicketStatus.RESOLVED)
      ) {
        await tx.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.REOPENED }
        });
      }

      return newMsg;
    });

    return message;
  }
}

