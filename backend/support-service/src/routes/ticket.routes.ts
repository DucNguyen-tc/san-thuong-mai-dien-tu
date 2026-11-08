import express from "express";
import { TicketController } from "../controllers/ticket.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import {
  createTicketSchema,
  addMessageSchema,
  listTicketsQuerySchema,
  escalateTicketSchema
} from "../schemas/ticket.schema";

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

export default router;

