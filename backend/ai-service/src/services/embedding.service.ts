import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env';

export class EmbeddingService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    if (env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  /**
   * Sinh vector embedding 1536 chiều cho văn bản.
   * Ưu tiên OpenAI -> Gemini -> Fallback TF-IDF hash vector (đảm bảo không bao giờ crash).
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text.replace(/\n+/g, ' ').trim();

    // 1. Thử dùng OpenAI text-embedding-3-small (1536 chiều)
    if (this.openaiClient && env.OPENAI_API_KEY) {
      try {
        const response = await this.openaiClient.embeddings.create({
          model: 'text-embedding-3-small',
          input: cleanText,
          dimensions: 1536,
        });
        return response.data[0].embedding;
      } catch (err: any) {
        console.warn('[EmbeddingService] OpenAI embedding failed, trying Gemini:', err.message);
      }
    }

    // 2. Thử dùng Google Gemini text-embedding-004
    if (this.geminiClient && env.GEMINI_API_KEY) {
      try {
        const model = this.geminiClient.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(cleanText);
        const values = result.embedding.values;
        // Chuẩn hóa vector về 1536 chiều (pad hoặc lặp lại nếu Gemini trả 768)
        if (values.length === 1536) return values;
        if (values.length === 768) {
          // Double up and normalize to 1536 dimensions
          const expanded = [...values, ...values];
          return this.normalizeVector(expanded);
        }
        return this.padOrTrimTo1536(values);
      } catch (err: any) {
        console.warn('[EmbeddingService] Gemini embedding failed, using local hash embedding:', err.message);
      }
    }

    // 3. Fallback Deterministic Semantic Hash Vector (Offline mode)
    return this.generateDeterministicVector(cleanText, 1536);
  }

  private normalizeVector(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return norm === 0 ? vec : vec.map((v) => v / norm);
  }

  private padOrTrimTo1536(vec: number[]): number[] {
    if (vec.length >= 1536) return this.normalizeVector(vec.slice(0, 1536));
    const padded = [...vec];
    while (padded.length < 1536) {
      padded.push(vec[padded.length % vec.length] * 0.9);
    }
    return this.normalizeVector(padded);
  }

  /**
   * Sinh vector giả lập có tính ngữ nghĩa theo từ khóa (khi không có API key ngoại)
   */
  private generateDeterministicVector(text: string, dimensions: 1536): number[] {
    const vector = new Array(dimensions).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const index = Math.abs(hash) % dimensions;
      vector[index] += 1.0;
    }

    return this.normalizeVector(vector);
  }
}

export const embeddingService = new EmbeddingService();

