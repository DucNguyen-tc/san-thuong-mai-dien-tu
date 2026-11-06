import { Request, Response } from "express";
import { TicketService } from "../services/ticket.service";
import { successResponse, errorResponse } from "../utils/response";

export class TicketController {
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
}

