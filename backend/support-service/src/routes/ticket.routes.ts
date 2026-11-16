import express from "express";
import { TicketController } from "../controllers/ticket.controller";
import { requireAuth, requireStaffOrAdmin } from "../middlewares/auth.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import {
  createTicketSchema,
  addMessageSchema,
  listTicketsQuerySchema,
  escalateTicketSchema
} from "../schemas/ticket.schema";
import {
  adminListTicketsQuerySchema,
  updateDraftSchema,
  rejectDraftSchema,
  approveAndSendSchema
} from "../schemas/admin-ticket.schema";

const router = express.Router();

// ==========================================
// INTERNAL API (Không qua Auth Middleware)
// ==========================================
// ai-service tự động escalate khi phát hiện khách bức xúc
router.post(
  "/escalate",
  validateBody(escalateTicketSchema),
  TicketController.escalateTicket
);

// ==========================================
// PUBLIC & CLIENT API (Yêu cầu xác thực người dùng)
// ==========================================
router.use(requireAuth);

router.post(
  "/",
  validateBody(createTicketSchema),
  TicketController.createTicket
);

router.get(
  "/",
  validateQuery(listTicketsQuerySchema),
  TicketController.getUserTickets
);

// ==========================================
// STAFF & ADMIN API (Yêu cầu role STAFF hoặc ADMIN)
// ==========================================
router.get(
  "/admin/stats",
  requireStaffOrAdmin,
  TicketController.getAdminStats
);

router.get(
  "/admin/tickets",
  requireStaffOrAdmin,
  validateQuery(adminListTicketsQuerySchema),
  TicketController.getAdminTickets
);

router.get(
  "/admin/tickets/:id",
  requireStaffOrAdmin,
  TicketController.getAdminTicketDetail
);

router.put(
  "/admin/tickets/:id/draft",
  requireStaffOrAdmin,
  validateBody(updateDraftSchema),
  TicketController.updateDraft
);

router.post(
  "/admin/tickets/:id/reject-draft",
  requireStaffOrAdmin,
  validateBody(rejectDraftSchema),
  TicketController.rejectDraft
);

router.post(
  "/admin/tickets/:id/approve-and-send",
  requireStaffOrAdmin,
  validateBody(approveAndSendSchema),
  TicketController.approveAndSend
);

// ==========================================
// CLIENT TICKET DETAIL & MESSAGES
// ==========================================
router.get(
  "/:id",
  TicketController.getTicketById
);

router.post(
  "/:id/messages",
  validateBody(addMessageSchema),
  TicketController.addMessage
);

// Kích hoạt phân tích cảm xúc (Retry / Manual trigger)
router.post(
  "/:id/analyze",
  TicketController.analyzeTicket
);

// AI Draft endpoints
router.get(
  "/:id/draft",
  TicketController.getTicketDraft
);

router.post(
  "/:id/draft/regenerate",
  TicketController.regenerateDraft
);

export default router;

