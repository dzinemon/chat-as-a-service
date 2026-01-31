# Chat as a Service - Server API

Hono-based backend API running on Cloudflare Workers with D1 database.

## Setup

### Prerequisites
- Node.js v22.14.0
- Wrangler CLI (installed as dependency)
- Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Install Dependencies

```bash
npm install
```

### Environment Variables

The `.env` file is pre-configured for local development:

```dotenv
GEMINI_API_KEY=your_google_generative_ai_api_key
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:5173
PORT=3000
```

**Update `GEMINI_API_KEY`** with your actual API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Database Setup

The server uses Cloudflare D1 (SQLite) with pre-configured database ID in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "chatbot"
database_id = "cf_database_id"
```

Run migrations to initialize the database:

```bash
npm run migrate
```

Or manually execute migrations:

```bash
wrangler d1 execute chatbot --file ./migrations/0001_init.sql
```

## Running the Application

### Development Mode

```bash
npm start
```

The server will start with Wrangler dev mode at [http://localhost:3000](http://localhost:3000).

### Other Commands

- **Type check**: `npm run type-check`
- **Format code**: `npm run format`
- **Lint code**: `npm run lint`
- **Deploy**: `npm run deploy` (requires Cloudflare account)

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

### Bots
- `GET /bots` - List user's bots
- `GET /bots/:id` - Get bot details
- `POST /bots` - Create new bot
- `DELETE /bots/:id` - Delete bot

### Chat
- `POST /chat/:botId` - Send message to bot and get AI response

### Widget
- `GET /widget.js` - Get embed script for external websites

## Database Schema

### Tables

**users**
- User account information
- Fields: id, email, password_hash, created_at

**sessions**
- Active user sessions
- Fields: id, user_id, token, created_at, expires_at

**bots**
- User's chatbots
- Fields: id, user_id, name, instructions, created_at, updated_at

**messages**
- Chat message history
- Fields: id, bot_id, role (user/assistant), content, created_at

## Architecture

- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite)
- **AI**: Google Generative AI (Gemini)
- **Deployment**: Cloudflare Workers

## Development Tips

- Changes to files in `src/` are automatically hot-reloaded in development
- Use `wrangler d1 execute chatbot --interactive` for interactive SQL queries
- Check `.wrangler/state/v3/d1/` for local database state

## Deployment

To deploy to Cloudflare Workers:

```bash
npm run deploy
```

Update `FRONTEND_URL` in `wrangler.toml` before deploying to point to your production frontend URL.
