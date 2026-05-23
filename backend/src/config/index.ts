import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  MT5_API_URL: z.string().default('http://localhost:8000'),
  GEMINI_API_KEY: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173,http://localhost:5174'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  database: {
    url: parsed.data.DATABASE_URL,
  },
  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
  },
  mt5Api: {
    url: parsed.data.MT5_API_URL,
  },
  gemini: {
    apiKey: parsed.data.GEMINI_API_KEY,
  },
  cors: {
    origins: parsed.data.CORS_ORIGINS.split(','),
  },
} as const;
