import dotenv from "dotenv";
dotenv.config();

export const llmConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.2"),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1000", 10)
  }
};

