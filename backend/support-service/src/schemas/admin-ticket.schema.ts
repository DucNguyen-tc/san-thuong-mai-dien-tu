import { z } from "zod";
import { TicketStatus, TicketPriority, TicketSentiment } from "@prisma/client";

export const adminListTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  sentiment: z.nativeEnum(TicketSentiment).optional(),
  category: z.string().optional(),
  search: z.string().optional()
});

export type AdminListTicketsQuery = z.infer<typeof adminListTicketsQuerySchema>;

export const updateDraftSchema = z.object({
  final_response: z.string().min(5, "Nội dung phản hồi tối thiểu 5 ký tự"),
  staff_notes: z.string().optional()
});

export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;

export const approveAndSendSchema = z.object({
  final_response: z.string().min(5, "Nội dung phản hồi tối thiểu 5 ký tự").optional(),
  staff_notes: z.string().optional()
});

export type ApproveAndSendInput = z.infer<typeof approveAndSendSchema>;

export const rejectDraftSchema = z.object({
  revision_instruction: z.string().min(5, "Chỉ dẫn chỉnh sửa phải có tối thiểu 5 ký tự")
});

export type RejectDraftInput = z.infer<typeof rejectDraftSchema>;

