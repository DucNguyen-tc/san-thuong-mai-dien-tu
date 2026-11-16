import { z } from "zod";
import { TicketStatus } from "@prisma/client";

export const createTicketSchema = z.object({
  subject: z
    .string({ required_error: "Tiêu đề không được để trống" })
    .trim()
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
    .max(500, "Tiêu đề tối đa 500 ký tự"),
  content: z
    .string({ required_error: "Nội dung không được để trống" })
    .trim()
    .min(10, "Mô tả chi tiết phải có ít nhất 10 ký tự"),
  category: z
    .enum(["REFUND", "WARRANTY", "SHIPPING", "PAYMENT", "PRODUCT", "ORDER", "OTHER"])
    .default("OTHER"),
  related_order_id: z.string().uuid("ID đơn hàng không hợp lệ").optional().nullable(),
  customer_email: z.string().email("Email không hợp lệ").optional(),
  customer_name: z.string().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url("URL file không hợp lệ"),
        name: z.string(),
        size: z.number().optional()
      })
    )
    .max(5, "Tối đa 5 file đính kèm")
    .optional()
});

export const addMessageSchema = z.object({
  content: z
    .string({ required_error: "Nội dung phản hồi không được để trống" })
    .trim()
    .min(1, "Nội dung phản hồi không được để trống"),
  attachments: z
    .array(
      z.object({
        url: z.string().url("URL file không hợp lệ"),
        name: z.string(),
        size: z.number().optional()
      })
    )
    .max(5, "Tối đa 5 file đính kèm")
    .optional()
});

export const listTicketsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  status: z.nativeEnum(TicketStatus).optional()
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;

export const escalateTicketSchema = z.object({
  customer_id: z.string().uuid("Customer ID không hợp lệ"),
  customer_email: z.string().email("Customer Email không hợp lệ"),
  customer_name: z.string().optional().default("Khách hàng"),
  chat_session_id: z.string().uuid("Chat Session ID không hợp lệ").optional().nullable(),
  subject: z
    .string({ required_error: "Tiêu đề không được để trống" })
    .trim()
    .min(3, "Tiêu đề phải có ít nhất 3 ký tự")
    .max(500, "Tiêu đề tối đa 500 ký tự"),
  content: z
    .string({ required_error: "Nội dung tóm tắt/hội thoại không được để trống" })
    .trim()
    .min(5, "Nội dung tối thiểu 5 ký tự"),
  category: z
    .enum(["REFUND", "WARRANTY", "SHIPPING", "PAYMENT", "PRODUCT", "ORDER", "OTHER"])
    .default("OTHER"),
  source: z.literal("AI_ESCALATE").default("AI_ESCALATE"),
  related_order_id: z.string().uuid("ID đơn hàng không hợp lệ").optional().nullable()
});

export type EscalateTicketInput = z.infer<typeof escalateTicketSchema>;

