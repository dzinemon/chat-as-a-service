# Hono Server Deployment Guide

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Create Cloudflare D1 Database
```bash
# Create the database
wrangler d1 create chatbot

# You'll get a database_id, copy it and update wrangler.toml
# Replace YOUR_DATABASE_ID with the actual ID
```

### 3. Run Migrations
```bash
wrangler d1 execute chatbot --file ./migrations/0001_init.sql
```

### 4. Update Environment Variables

Add to `wrangler.toml`:
```toml
[vars]
GEMINI_API_KEY = "your-actual-api-key"
GEMINI_MODEL = "gemini-2.5-flash"
FRONTEND_URL = "https://chat-service.YOUR-ACCOUNT.workers.dev"
```

### 5. Test Locally
```bash
npm start
# API will be available at http://localhost:8787
```

### 6. Deploy to Cloudflare Workers
```bash
npm run deploy
```

## API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `GET /bots` - List user's bots
- `GET /bots/:id` - Get bot details
- `POST /bots` - Create bot
- `DELETE /bots/:id` - Delete bot
- `POST /chat/:botId` - Send message to bot
- `GET /widget.js` - Get widget script

## Database

Uses Cloudflare D1 (SQLite) with auto-initialization on first request.

Tables:
- `users` - User accounts
- `sessions` - Active sessions
- `bots` - User's chatbots
