require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  randomUUID,
  scryptSync,
  randomBytes,
  timingSafeEqual,
} = require('node:crypto');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.json());

// --- Auth Helpers ---
const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hashedPassword}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, key] = storedHash.split(':');
  const hashedPassword = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  return timingSafeEqual(hashedPassword, keyBuffer);
};

// --- Middleware ---
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  db.get(
    `SELECT users.id, users.email, users.role 
         FROM sessions 
         JOIN users ON sessions.user_id = users.id 
         WHERE sessions.token = ?`,
    [token],
    (err, user) => {
      if (err) return res.sendStatus(500);
      if (!user) return res.sendStatus(403);
      req.user = user;
      next();
    }
  );
};

// Serve dynamic widget.js
app.get('/widget.js', (_req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
(function() {
    const script = document.currentScript;
    const botId = script.getAttribute('data-bot-id');
    const frontendUrl = '${frontendUrl}';

    if (!botId) {
        console.error('ChatWidget: data-bot-id attribute is missing.');
        return;
    }

    const container = document.createElement('div');
    container.id = 'chat-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.width = '400px'; 
    container.style.height = '600px';
    container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    container.style.borderRadius = '12px';
    container.style.overflow = 'hidden';
    container.style.display = 'block';

    const iframe = document.createElement('iframe');
    iframe.src = \`\${frontendUrl}/widget/\${botId}\`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    container.appendChild(iframe);
    document.body.appendChild(container);
})();
    `);
});

// Initialize Gemini
// Note: User must provide GEMINI_API_KEY in .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Auth Routes ---

// POST /auth/register
app.post('/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const hashedPassword = hashPassword(password); // returns "salt:hash"
  const userId = randomUUID();

  db.run(
    'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
    [userId, email, hashedPassword],
    (err) => {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'User created' });
    }
  );
});

// POST /auth/login
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = randomUUID();
    db.run(
      'INSERT INTO sessions (token, user_id) VALUES (?, ?)',
      [token, user.id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ token, user: { id: user.id, email: user.email } });
      }
    );
  });
});

// POST /auth/logout
app.post('/auth/logout', authenticateUser, (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  db.run('DELETE FROM sessions WHERE token = ?', [token], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Logged out' });
  });
});

// GET /auth/me
app.get('/auth/me', authenticateUser, (req, res) => {
  res.json(req.user);
});

// --- Bot Routes ---

// GET /bots - List user's bots
app.get('/bots', authenticateUser, (req, res) => {
  db.all(
    'SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET /bots/:id - Get single bot details (public)
app.get('/bots/:id', (req, res) => {
  const { id } = req.params;
  db.get(
    'SELECT id, name, created_at FROM bots WHERE id = ?',
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Bot not found' });
      res.json(row);
    }
  );
});

// POST /bots - Create a new bot
app.post('/bots', authenticateUser, (req, res) => {
  const { name, instructions, allowed_domains } = req.body;
  if (!name || !instructions) {
    return res
      .status(400)
      .json({ error: 'Name and instructions are required.' });
  }

  const id = randomUUID();
  const sql = `INSERT INTO bots (id, user_id, name, instructions, allowed_domains) VALUES (?, ?, ?, ?, ?)`;
  const params = [
    id,
    req.user.id,
    name,
    instructions,
    JSON.stringify(allowed_domains || []),
  ];

  db.run(sql, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id, name, instructions, allowed_domains });
  });
});

// DELETE /bots/:id - Delete a bot
app.delete('/bots/:id', authenticateUser, (req, res) => {
  const { id } = req.params;
  db.run(
    'DELETE FROM bots WHERE id = ? AND user_id = ?',
    [id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: 'Bot not found or unauthorized' });
      res.json({ message: 'Bot deleted', changes: this.changes });
    }
  );
});

// POST /chat/:botId - Chat Endpoint
app.post('/chat/:botId', async (req, res) => {
  const { botId } = req.params;
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  // 1. Fetch Bot Instructions
  db.get('SELECT * FROM bots WHERE id = ?', [botId], async (err, bot) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    try {
      // 2. Call Gemini
      // Use model from env or default to 1.5-flash
      const modelName = process.env.GEMINI_MODEL;
      const model = genAI.getGenerativeModel({ model: modelName });

      // Simple chat structure using system instruction as context
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

      res.json({ response: text });
    } catch (aiError) {
      console.error('Gemini Error:', aiError);
      res
        .status(500)
        .json({ error: 'Failed to process with AI', details: aiError.message });
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
