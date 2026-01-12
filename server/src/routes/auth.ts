import { Hono } from 'hono';
import { hashPassword, verifyPassword, generateToken } from '../auth';
import {
  findUserByEmail,
  createUser,
  createSession,
  deleteSession,
  getUser,
} from '../db';
import { HonoEnv } from '../index';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const auth = new Hono<HonoEnv>();

// POST /auth/register
auth.post('/register', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json(
      { error: 'Email and password required' },
      400
    );
  }

  const db = c.env.DB;

  try {
    const existingUser = await findUserByEmail(db, email);
    if (existingUser) {
      return c.json({ error: 'Email already exists' }, 409);
    }

    const userId = generateUUID();
    const hashedPassword = await hashPassword(password);

    await createUser(db, userId, email, hashedPassword);

    return c.json({ message: 'User created' }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json(
      { error: 'Registration failed' },
      500
    );
  }
});

// POST /auth/login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json(
      { error: 'Email and password required' },
      400
    );
  }

  const db = c.env.DB;

  try {
    const user = await findUserByEmail(db, email);

    if (!user || !(await verifyPassword(password, user.password))) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = generateToken();
    await createSession(db, user.id, token);

    return c.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// POST /auth/logout
auth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const db = c.env.DB;

  try {
    await deleteSession(db, token);
    return c.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// GET /auth/me
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const db = c.env.DB;

  try {
    const user = await getUser(db, token);

    if (!user) {
      return c.json({ error: 'User not found' }, 403);
    }

    return c.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

export default auth;
