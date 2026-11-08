import OpenAI from "openai";
import { llmConfig } from "../config/llm.config";

export class LLMClient {
  private static instance: OpenAI | null = null;

  private static getClient(): OpenAI {
    if (!this.instance) {
      if (!llmConfig.openai.apiKey) {
        throw new Error(
          "OPENAI_API_KEY chưa được cấu hình trong support-service .env"
        );
      }
      this.instance = new OpenAI({
        apiKey: llmConfig.openai.apiKey
      });
    }
    return this.instance;
  }

  /**
   * Gọi OpenAI để sinh phản hồi JSON có cấu trúc
   */
  static async generateStructuredResponse(
    prompt: string,
    systemInstruction?: string
  ): Promise<string> {
    const client = this.getClient();

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (systemInstruction) {
      messages.push({
        role: "system",
        content: systemInstruction
      });
    }

    messages.push({
      role: "user",
      content: prompt
    });

    try {
      const response = await client.chat.completions.create({
        model: llmConfig.openai.model,
        messages,
        response_format: { type: "json_object" },
        temperature: llmConfig.openai.temperature,
        max_tokens: llmConfig.openai.maxTokens
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI trả về nội dung rỗng (empty response)");
      }

      return content;
    } catch (error: any) {
      console.error("[LLMClient Error]:", error?.message || error);
      throw error;
    }
  }
}

