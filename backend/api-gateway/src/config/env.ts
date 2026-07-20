import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

  IDENTITY_SERVICE_URL: z.string().url(),
  CATALOG_SERVICE_URL: z.string().url(),
  CART_SERVICE_URL: z.string().url(),
  ORDER_SERVICE_URL: z.string().url(),
  PAYMENT_SERVICE_URL: z.string().url(),
  NOTIFICATION_SERVICE_URL: z.string().url(),
  RECOMMENDATION_SERVICE_URL: z.string().url(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
