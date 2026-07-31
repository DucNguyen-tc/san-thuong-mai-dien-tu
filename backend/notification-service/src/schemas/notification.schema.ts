import { z } from "zod";

export const updateTemplateSchema = z.object({
  subject_template: z.string().min(1, "Tiêu đề không được để trống"),
  body_template: z.string().min(1, "Nội dung không được để trống"),
});
