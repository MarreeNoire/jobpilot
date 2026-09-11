import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from root and working directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configuration schema
const configSchema = z.object({
  // Database
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/jobpilot?schema=public'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Ollama
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama2'),

  // Storage (S3-compatible)
  STORAGE_ENDPOINT: z.string().url().default('http://localhost:9000'),
  STORAGE_BUCKET: z.string().default('jobpilot'),
  STORAGE_ACCESS_KEY: z.string().default('minioadmin'),
  STORAGE_SECRET_KEY: z.string().default('minioadmin'),

  // Auth
  AUTH_SECRET: z.string().default('jobpilot-dev-secret-key-32-chars-long!'),

  // Frontend (used for CORS)
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // NextAuth (if used)
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().default('jobpilot-dev-nextauth-secret-key-123'),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Type inference for our config
export type Config = z.infer<typeof configSchema>;

// Load and validate configuration
let config: Config;

try {
  config = configSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.errors.map(err =>
      `${err.path.join('.')}: ${err.message}`
    ).join('\n');
    throw new Error(`Configuration validation failed:\n${errorMessages}`);
  } else {
    throw error;
  }
}

// Make config available as a module singleton
export { config };