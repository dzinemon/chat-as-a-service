const sqlite3 = require('sqlite3').verbose();
const path = require('node:path');

// Connect to database
const dbPath = path.resolve(__dirname, 'chatbot.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password TEXT,
            salt TEXT,
            role TEXT
        )`);

    // Sessions Table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

    // Bots Table - Dropping to ensure schema update for MVP
    db.serialize(() => {
      db.run('DROP TABLE IF EXISTS bots'); // Reset bots table to add user_id
      db.run(`CREATE TABLE IF NOT EXISTS bots (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT,
                instructions TEXT,
                allowed_domains TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);
    });
  });
}

module.exports = db;
