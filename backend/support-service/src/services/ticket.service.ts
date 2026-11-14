import { prisma } from "../config/prisma";
import { generateTicketNumber } from "../utils/ticketNumber";
import {
  CreateTicketInput,
  AddMessageInput,
  ListTicketsQuery,
  EscalateTicketInput
} from "../schemas/ticket.schema";
import {
  AdminListTicketsQuery,
  UpdateDraftInput,
  RejectDraftInput,
  ApproveAndSendInput
} from "../schemas/admin-ticket.schema";
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

  /**
   * Lấy danh sách ticket cho nhân viên CSKH / Admin
   * Sắp xếp theo ưu tiên P1 -> P4, rồi đến FIFO (cũ nhất trước)
   */
  static async getAdminTickets(query: AdminListTicketsQuery) {
    const { page, limit, status, priority, sentiment, category, search } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(sentiment ? { sentiment } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { ticket_number: { contains: search, mode: "insensitive" } },
              { subject: { contains: search, mode: "insensitive" } },
              { customer_name: { contains: search, mode: "insensitive" } },
              { customer_email: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [total, items] = await Promise.all([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { priority: "asc" }, // P1, P2, P3, P4
          { created_at: "asc" } // FIFO
        ],
        include: {
          responses: {
            orderBy: { created_at: "desc" },
            take: 1
          },
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
   * Lấy chi tiết ticket cho nhân viên CSKH / Admin
   */
  static async getAdminTicketDetail(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { created_at: "asc" } },
        responses: { orderBy: { created_at: "desc" } }
      }
    });
    if (!ticket) throw new Error("Không tìm thấy ticket yêu cầu");
    return ticket;
  }

  /**
   * Cập nhật nội dung bản nháp và ghi chú của nhân viên
   */
  static async updateDraft(ticketId: string, staffId: string, input: UpdateDraftInput) {
    const latestResponse = await prisma.ticketResponse.findFirst({
      where: { ticket_id: ticketId },
      orderBy: { created_at: "desc" }
    });
    if (!latestResponse) throw new Error("Không tìm thấy bản nháp để chỉnh sửa");

    const updated = await prisma.ticketResponse.update({
      where: { id: latestResponse.id },
      data: {
        final_response: input.final_response,
        staff_notes: input.staff_notes || latestResponse.staff_notes,
        staff_id: staffId
      }
    });
    return updated;
  }

  /**
   * Từ chối bản nháp và yêu cầu AI sinh lại bản nháp mới kèm chỉ dẫn điều chỉnh (Feedback Loop)
   */
  static async rejectDraft(ticketId: string, staffId: string, input: RejectDraftInput) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          where: { sender_type: SenderType.CUSTOMER },
          orderBy: { created_at: "asc" },
          take: 1
        },
        responses: {
          orderBy: { created_at: "desc" },
          take: 1
        }
      }
    });
    if (!ticket) throw new Error("Không tìm thấy ticket");

    const latestDraft = ticket.responses[0];
    if (latestDraft) {
      await prisma.ticketResponse.update({
        where: { id: latestDraft.id },
        data: {
          review_status: ReviewStatus.REJECTED,
          staff_notes: input.revision_instruction,
          staff_id: staffId
        }
      });
    }

    const ragQuery = `${ticket.ai_summary || ticket.subject} ${input.revision_instruction}`.trim();
    const ragChunks = await RagClient.queryPolicies(ragQuery, 3, 0.65);

    const draftResult = await DraftService.generateDraft({
      customerName: ticket.customer_name || "Khách hàng",
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      content: ticket.messages[0]?.content || ticket.subject,
      sentiment: ticket.sentiment || "NEUTRAL",
      sentimentScore: ticket.sentiment_score || 50,
      summary: ticket.ai_summary || ticket.subject,
      keyIssues: [],
      ragChunks,
      revisionInstruction: input.revision_instruction
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

  /**
   * Nhân viên duyệt và gửi phản hồi cho khách hàng
   */
  static async approveAndSend(ticketId: string, staffId: string, input: ApproveAndSendInput) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        responses: { orderBy: { created_at: "desc" }, take: 1 }
      }
    });
    if (!ticket) throw new Error("Không tìm thấy ticket");

    const latestDraft = ticket.responses[0];
    if (!latestDraft) throw new Error("Ticket chưa có bản nháp nào để duyệt");

    const finalContent = input.final_response || latestDraft.final_response || latestDraft.ai_draft;
    if (!finalContent || finalContent.trim().length < 5) {
      throw new Error("Nội dung phản hồi không hợp lệ");
    }

    const now = new Date();

    // DB Transaction: Update response, add STAFF message, update ticket status
    await prisma.$transaction(async (tx) => {
      await tx.ticketResponse.update({
        where: { id: latestDraft.id },
        data: {
          final_response: finalContent,
          staff_notes: input.staff_notes || latestDraft.staff_notes,
          review_status: ReviewStatus.APPROVED,
          staff_id: staffId,
          reviewed_at: now,
          sent_at: now
        }
      });

      await tx.ticketMessage.create({
        data: {
          ticket_id: ticketId,
          sender_type: SenderType.STAFF,
          sender_id: staffId,
          content: finalContent
        }
      });

      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.RESPONDED
        }
      });
    });

    // RabbitMQ Publish sang notification-service
    await rabbitMQService.publishTicketReplied({
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      recipientEmail: ticket.customer_email,
      customerName: ticket.customer_name || "Quý khách",
      ticketSubject: ticket.subject,
      emailSubject: `[${ticket.ticket_number}] Phản hồi yêu cầu hỗ trợ: ${ticket.subject}`,
      finalResponse: finalContent,
      staffId
    });

    return {
      ticketId,
      ticketNumber: ticket.ticket_number,
      status: TicketStatus.RESPONDED,
      sentAt: now
    };
  }

  /**
   * Thống kê tổng quan cho Admin CSKH
   */
  static async getAdminStats() {
    const [
      totalTickets,
      byStatusRaw,
      byPriorityRaw,
      bySentimentRaw,
      totalResponses
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { _all: true }
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        _count: { _all: true }
      }),
      prisma.ticket.groupBy({
        by: ["sentiment"],
        _count: { _all: true }
      }),
      prisma.ticketResponse.groupBy({
        by: ["review_status"],
        _count: { _all: true }
      })
    ]);

    const byStatus = byStatusRaw.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = byPriorityRaw.reduce((acc, curr) => {
      acc[curr.priority] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    const bySentiment = bySentimentRaw.reduce((acc, curr) => {
      if (curr.sentiment) acc[curr.sentiment] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    const byReviewStatus = totalResponses.reduce((acc, curr) => {
      acc[curr.review_status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTickets,
      byStatus,
      byPriority,
      bySentiment,
      byReviewStatus
    };
  }
}

