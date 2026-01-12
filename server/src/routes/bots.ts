import { Hono } from 'hono';
import { getUser } from '../db';
import { HonoEnv } from '../index';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const bots = new Hono<HonoEnv>();

// Middleware to authenticate user
const authenticateUser = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = c.env.DB;
  const user = await getUser(db, token);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.user = user;
  await next();
};

// GET /bots - List user's bots
bots.get('/', authenticateUser, async (c) => {
  const db = c.env.DB;
  const userId = c.user.id;

  try {
    const botsList = await db
      .prepare(
        'SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC'
      )
      .bind(userId)
      .all();

    return c.json(botsList.results || []);
  } catch (error) {
    console.error('Get bots error:', error);
    return c.json({ error: 'Failed to fetch bots' }, 500);
  }
});

// GET /bots/:id - Get single bot details (public)
bots.get('/:id', async (c) => {
  const db = c.env.DB;
  const botId = c.req.param('id');

  try {
    const bot = await db
      .prepare('SELECT id, name, created_at FROM bots WHERE id = ?')
      .bind(botId)
      .first();

    if (!bot) {
      return c.json({ error: 'Bot not found' }, 404);
    }

    return c.json(bot);
  } catch (error) {
    console.error('Get bot error:', error);
    return c.json({ error: 'Failed to fetch bot' }, 500);
  }
});

// POST /bots - Create a new bot
bots.post('/', authenticateUser, async (c) => {
  const { name, instructions, allowed_domains } = await c.req.json();

  if (!name || !instructions) {
    return c.json(
      { error: 'Name and instructions are required' },
      400
    );
  }

  const db = c.env.DB;
  const botId = generateUUID();
  const userId = c.user.id;

  try {
    await db
      .prepare(
        'INSERT INTO bots (id, user_id, name, instructions, allowed_domains) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        botId,
        userId,
        name,
        instructions,
        JSON.stringify(allowed_domains || [])
      )
      .run();

    return c.json(
      { id: botId, name, instructions, allowed_domains },
      201
    );
  } catch (error) {
    console.error('Create bot error:', error);
    return c.json({ error: 'Failed to create bot' }, 500);
  }
});

// DELETE /bots/:id - Delete a bot
bots.delete('/:id', authenticateUser, async (c) => {
  const db = c.env.DB;
  const botId = c.req.param('id');
  const userId = c.user.id;

  try {
    const result = await db
      .prepare('DELETE FROM bots WHERE id = ? AND user_id = ?')
      .bind(botId, userId)
      .run();

    if (result.meta.changes === 0) {
      return c.json(
        { error: 'Bot not found or unauthorized' },
        404
      );
    }

    return c.json({ message: 'Bot deleted' });
  } catch (error) {
    console.error('Delete bot error:', error);
    return c.json({ error: 'Failed to delete bot' }, 500);
  }
});

export default bots;
