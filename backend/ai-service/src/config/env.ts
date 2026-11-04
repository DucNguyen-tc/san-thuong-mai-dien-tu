import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend/ai-service directory as well as process cwd
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('3010'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://admin:1234567@localhost:5432/ai_db?schema=public'),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  CATALOG_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  CART_SERVICE_URL: z.string().url().default('http://localhost:3003'),
  ORDER_SERVICE_URL: z.string().url().default('http://localhost:3004'),
  SUPPORT_SERVICE_URL: z.string().url().default('http://localhost:3009'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
