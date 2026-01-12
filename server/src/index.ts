import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { hashPassword, verifyPassword } from './auth';
import { initializeDatabase } from './db';
import authRoutes from './routes/auth';
import botRoutes from './routes/bots';
import chatRoutes from './routes/chat';
import widgetRoutes from './routes/widget';

export interface Env {
  DB: D1Database;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  FRONTEND_URL: string;
}

export interface HonoEnv {
  Bindings: Env;
}

const app = new Hono<HonoEnv>();

// CORS Middleware
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Initialize database on first request
app.use(async (c, next) => {
  const db = c.env.DB;
  await initializeDatabase(db);
  await next();
});

// Routes
app.route('/auth', authRoutes);
app.route('/bots', botRoutes);
app.route('/chat', chatRoutes);
app.route('/widget', widgetRoutes);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' }, 200);
});

// 404 Handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
