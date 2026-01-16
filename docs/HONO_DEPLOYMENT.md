# Hono Server Deployment Guide

## Local Development

See the main [README.md](../README.md) for local development setup.

## Production Deployment Guide

### 1. Install Dependencies
```bash
cd server
nvm use
npm install
```

### 2. Cloudflare D1 Database
The database is already configured in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "chatbot"
database_id = "YOUR_PRODUCTION_DATABASE_ID"
```

For a new project, create a database:
```bash
# Create the database
wrangler d1 create chatbot

# Copy the database_id returned and update wrangler.toml
```

### 3. Run Migrations
```bash
wrangler d1 execute chatbot --file ./migrations/0001_init.sql
```

Or for production database:
```bash
wrangler d1 execute chatbot --remote --file ./migrations/0001_init.sql
```

### 4. Update Environment Variables

Update `wrangler.toml` with your production values:

```toml
[vars]
GEMINI_API_KEY = "your-actual-api-key"
GEMINI_MODEL = "gemini-2.5-flash"
FRONTEND_URL = "https://chat-service.YOUR-ACCOUNT.workers.dev"

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "chatbot"
database_id = "YOUR_PRODUCTION_DATABASE_ID"
```

### 5. Test Locally
```bash
nvm use
npm start
# API will be available at http://localhost:3000
```

### 6. Deploy to Cloudflare Workers
```bash
npm run deploy
```

Or for production environment:
```bash
wrangler deploy --env production
```

### 7. Verify Deployment

Your API will be available at: `https://chat-service.YOUR-ACCOUNT.workers.dev`

Test the health endpoint:
```bash
curl https://chat-service.YOUR-ACCOUNT.workers.dev/auth/me
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
