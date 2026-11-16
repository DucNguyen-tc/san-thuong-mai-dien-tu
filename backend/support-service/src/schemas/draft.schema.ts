import { z } from "zod";

export const DraftResponseSchema = z.object({
  draft: z
    .string({ required_error: "Bản nháp email không được để trống" })
    .min(20, "Nội dung email phản hồi quá ngắn"),
  tone: z.enum(["EMPATHETIC", "APOLOGETIC", "INFORMATIVE"]),
  confidence: z.number().int().min(0).max(100),
  policy_references: z.array(z.string()).default([])
});

export type DraftResponseResult = z.infer<typeof DraftResponseSchema>;

