import { z } from "zod";

export const SentimentAnalysisSchema = z.object({
  sentiment: z.enum(["ANGRY", "FRUSTRATED", "DISAPPOINTED", "NEUTRAL"]),
  sentiment_score: z.number().int().min(0).max(100),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  category: z.enum([
    "REFUND",
    "WARRANTY",
    "SHIPPING",
    "PAYMENT",
    "PRODUCT",
    "ORDER",
    "OTHER"
  ]),
  summary: z.string().min(1),
  key_issues: z.array(z.string()).default([])
});

export type SentimentAnalysisResult = z.infer<typeof SentimentAnalysisSchema>;

