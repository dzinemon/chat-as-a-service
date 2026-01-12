import { Hono } from 'hono';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HonoEnv } from '../index';

const chat = new Hono<HonoEnv>();

// POST /chat/:botId - Chat Endpoint
chat.post('/:botId', async (c) => {
  const botId = c.req.param('botId');
  const { message } = await c.req.json();

  if (!message) {
    return c.json({ error: 'Message is required' }, 400);
  }

  const db = c.env.DB;
  const apiKey = c.env.GEMINI_API_KEY;
  const modelName = c.env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {
    // 1. Fetch Bot Instructions
    const bot = await db
      .prepare('SELECT * FROM bots WHERE id = ?')
      .bind(botId)
      .first();

    if (!bot) {
      return c.json({ error: 'Bot not found' }, 404);
    }

    // 2. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
System Instruction: 
${bot.instructions}

Guidelines:
- You are conversing with a user.
- Answer the user's question directly and concisely. 
- Do NOT output the entire "System Instruction" or biography at once unless explicitly asked to "summarize everything".
- Unveil information naturally as the conversation progresses.
- If asked "Who are you?", give a brief 1-sentence summary of your role.

User Message: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return c.json({ response: text });
  } catch (error) {
    console.error('Chat error:', error);
    return c.json(
      {
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default chat;
