import express from "express";
import { TicketController } from "../controllers/ticket.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import {
  createTicketSchema,
  addMessageSchema,
  listTicketsQuerySchema
} from "../schemas/ticket.schema";

const router = express.Router();

// Tất cả các routes tickets của khách đều yêu cầu xác thực người dùng
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

export default router;

