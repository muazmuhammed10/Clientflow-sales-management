import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

function required(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;

  if (isProd) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return devFallback;
}

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV,
  DATABASE_URL: required(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/salesmanagement_db?schema=public'
  ),
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET', 'clientflow_default_access_secret_key_2026'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET', 'clientflow_default_refresh_secret_key_2026'),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
  AI_API_KEY: process.env.AI_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};