import { Request, Response } from "express";
import { TicketService } from "../services/ticket.service";
import { successResponse, errorResponse } from "../utils/response";

export class TicketController {
  /**
   * POST /api/support/tickets/escalate
   * Internal API: nhận yêu cầu escalate từ ai-service khi khách bức xúc
   */
  static async escalateTicket(req: Request, res: Response) {
    try {
      const result = await TicketService.escalateTicket(req.body);
      return successResponse(
        res,
        result,
        "Ticket đã được tạo thành công và chuyển sang hàng đợi AI phân tích",
        201
      );
    } catch (error: any) {
      return errorResponse(res, error.message || "Không thể escalate ticket", 400);
    }
  }

  /**
   * POST /api/support/tickets
   */
  static async createTicket(req: Request, res: Response) {
    try {
      const user = req.user!;
      const ticket = await TicketService.createTicket(
        user.id,
        req.body,
        user.email,
        user.name
      );
      return successResponse(res, ticket, "Tạo ticket thành công", 201);
    } catch (error: any) {
      return errorResponse(res, error.message || "Không thể tạo ticket", 400);
    }
  }

  /**
   * GET /api/support/tickets
   */
  static async getUserTickets(req: Request, res: Response) {
    try {
      const user = req.user!;
      const result = await TicketService.getUserTickets(user.id, req.query as any);
      return successResponse(res, result, "Lấy danh sách ticket thành công");
    } catch (error: any) {
      return errorResponse(res, error.message || "Không thể lấy danh sách ticket", 400);
    }
  }

  /**
   * GET /api/support/tickets/:id
   */
  static async getTicketById(req: Request, res: Response) {
    try {
      const user = req.user!;
      const ticket = await TicketService.getTicketById(req.params.id, user.id, user.role);
      return successResponse(res, ticket, "Lấy thông tin ticket thành công");
    } catch (error: any) {
      const statusCode = error.message.includes("quyền") ? 403 : 404;
      return errorResponse(res, error.message || "Không tìm thấy ticket", statusCode);
    }
  }

  /**
   * POST /api/support/tickets/:id/messages
   */
  static async addMessage(req: Request, res: Response) {
    try {
      const user = req.user!;
      const message = await TicketService.addMessage(
        req.params.id,
        user.id,
        user.role,
        req.body
      );
      return successResponse(res, message, "Gửi tin nhắn thành công", 201);
    } catch (error: any) {
      const statusCode = error.message.includes("quyền") ? 403 : 400;
      return errorResponse(res, error.message || "Không thể gửi tin nhắn", statusCode);
    }
  }

  /**
   * POST /api/support/tickets/:id/analyze
   * Kích hoạt phân tích cảm xúc thủ công / retry
   */
  static async analyzeTicket(req: Request, res: Response) {
    try {
      const result = await TicketService.triggerAnalysis(req.params.id);
      return successResponse(
        res,
        result,
        "Đã kích hoạt phân tích cảm xúc cho ticket"
      );
    } catch (error: any) {
      return errorResponse(
        res,
        error.message || "Không thể kích hoạt phân tích cảm xúc",
        400
      );
    }
  }

  /**
   * GET /api/support/tickets/:id/draft
   * Lấy bản nháp AI Draft của ticket (dành cho CSKH)
   */
  static async getTicketDraft(req: Request, res: Response) {
    try {
      const draft = await TicketService.getTicketDraft(req.params.id);
      return successResponse(res, draft, "Lấy AI draft thành công");
    } catch (error: any) {
      return errorResponse(res, error.message || "Không tìm thấy draft", 404);
    }
  }

  /**
   * POST /api/support/tickets/:id/draft/regenerate
   * Yêu cầu AI soạn lại bản nháp
   */
  static async regenerateDraft(req: Request, res: Response) {
    try {
      const newDraft = await TicketService.regenerateDraft(req.params.id);
      return successResponse(res, newDraft, "Đã soạn lại AI draft thành công", 201);
    } catch (error: any) {
      return errorResponse(
        res,
        error.message || "Không thể soạn lại AI draft",
        400
      );
    }
  }
}
