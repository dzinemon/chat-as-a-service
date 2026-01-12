import { Env } from './index';

export async function initializeDatabase(db: D1Database): Promise<void> {
  try {
    // Users Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Sessions Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    // Bots Table
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS bots (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        instructions TEXT NOT NULL,
        allowed_domains TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

export async function getUser(db: D1Database, token: string) {
  const result = await db
    .prepare(
      `SELECT users.id, users.email, users.role 
       FROM sessions 
       JOIN users ON sessions.user_id = users.id 
       WHERE sessions.token = ?`
    )
    .bind(token)
    .first();

  return result;
}

export async function createSession(
  db: D1Database,
  userId: string,
  token: string
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO sessions (token, user_id) VALUES (?, ?)'
    )
    .bind(token, userId)
    .run();
}

export async function deleteSession(
  db: D1Database,
  token: string
): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE token = ?')
    .bind(token)
    .run();
}

export async function findUserByEmail(db: D1Database, email: string) {
  return await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first();
}

export async function createUser(
  db: D1Database,
  id: string,
  email: string,
  hashedPassword: string
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO users (id, email, password) VALUES (?, ?, ?)'
    )
    .bind(id, email, hashedPassword)
    .run();
}
