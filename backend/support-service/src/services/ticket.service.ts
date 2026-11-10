import { prisma } from "../config/prisma";
import { generateTicketNumber } from "../utils/ticketNumber";
import {
  CreateTicketInput,
  AddMessageInput,
  ListTicketsQuery,
  EscalateTicketInput
} from "../schemas/ticket.schema";
import { TicketSource, TicketStatus, TicketPriority, SenderType, ReviewStatus } from "@prisma/client";
import { rabbitMQService } from "../rabbitmq/rabbitmq.service";
import { TicketAnalyzerPipeline } from "./ticket-analyzer.pipeline";
import { RagClient } from "./rag.client";
import { DraftService } from "./draft.service";

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

    // Tự động kích hoạt phân tích cảm xúc qua RabbitMQ (hỗ trợ fallback in-process)
    await rabbitMQService.publishTicketCreated(createdTicket.id);

    return createdTicket;
  }

  /**
   * Tạo ticket tự động từ AI Chat Assistant (source: AI_ESCALATE)
   * Phục vụ Tool escalate_to_ticket từ ai-service khi khách bức xúc
   */
  static async escalateTicket(input: EscalateTicketInput) {
    const ticketNumber = await generateTicketNumber();

    const createdTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticket_number: ticketNumber,
          customer_id: input.customer_id,
          customer_email: input.customer_email,
          customer_name: input.customer_name || "Khách hàng",
          subject: input.subject,
          category: input.category || "OTHER",
          related_order_id: input.related_order_id || null,
          chat_session_id: input.chat_session_id || null,
          source: TicketSource.AI_ESCALATE,
          priority: TicketPriority.P1, // Escalate do bức xúc khởi tạo mặc định P1
          status: TicketStatus.OPEN
        }
      });

      // Tạo tin nhắn đầu tiên chứa nội dung trao đổi / tóm tắt bức xúc
      await tx.ticketMessage.create({
        data: {
          ticket_id: ticket.id,
          sender_type: SenderType.CUSTOMER,
          sender_id: input.customer_id,
          content: input.content
        }
      });

      return ticket;
    });

    // Kích hoạt phân tích cảm xúc qua RabbitMQ
    await rabbitMQService.publishTicketCreated(createdTicket.id);

    return {
      ticket_id: createdTicket.id,
      ticket_number: createdTicket.ticket_number,
      status: createdTicket.status,
      priority: createdTicket.priority
    };
  }

  /**
   * Kích hoạt phân tích cảm xúc thủ công (cho Admin / Test / Retry)
   */
  static async triggerAnalysis(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error("Không tìm thấy ticket yêu cầu");
    }

    // Đẩy vào queue hoặc xử lý trực tiếp
    await rabbitMQService.publishTicketCreated(ticketId);
    return { ticketId, status: "ANALYZING_TRIGGERED" };
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

  /**
   * Lấy bản nháp AI Draft của ticket (dành cho CSKH)
   */
  static async getTicketDraft(ticketId: string) {
    const draft = await prisma.ticketResponse.findFirst({
      where: { ticket_id: ticketId },
      orderBy: { created_at: "desc" }
    });

    if (!draft) {
      throw new Error("Chưa có bản nháp AI cho ticket này");
    }

    return draft;
  }

  /**
   * Yêu cầu AI soạn lại bản nháp (Regenerate Draft)
   */
  static async regenerateDraft(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          where: { sender_type: SenderType.CUSTOMER },
          orderBy: { created_at: "asc" },
          take: 1
        }
      }
    });

    if (!ticket) {
      throw new Error("Không tìm thấy ticket yêu cầu");
    }

    const firstMessage = ticket.messages[0]?.content || "";
    const contentToAnalyze = firstMessage || ticket.subject;

    const ragQuery = `${ticket.ai_summary || ticket.subject}`.trim();
    const ragChunks = await RagClient.queryPolicies(ragQuery, 3, 0.65);

    const draftResult = await DraftService.generateDraft({
      customerName: ticket.customer_name || "Khách hàng",
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      content: contentToAnalyze,
      sentiment: ticket.sentiment || "NEUTRAL",
      sentimentScore: ticket.sentiment_score || 50,
      summary: ticket.ai_summary || ticket.subject,
      keyIssues: [],
      ragChunks
    });

    const newDraft = await prisma.ticketResponse.create({
      data: {
        ticket_id: ticketId,
        ai_draft: draftResult.draft,
        rag_chunks_used: ragChunks as any,
        ai_tone: draftResult.tone,
        ai_confidence: draftResult.confidence,
        review_status: ReviewStatus.PENDING
      }
    });

    return newDraft;
  }
}

