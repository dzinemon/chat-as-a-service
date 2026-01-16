# Chat as a Service

A full-stack chatbot creation platform using React, Hono, and Google Gemini.

## Prerequisites

- **Docker** (recommended) OR Node.js v22.14.0
- Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Quick Start with Docker (Recommended)

The easiest way to run the application locally:

```bash
# 1. Copy environment file and add your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 2. Start both client and server
docker-compose up

# Or run in detached mode
docker-compose up -d
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:3000

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start containers |
| `docker-compose up --build` | Rebuild and start (after dependency changes) |
| `docker-compose up -d` | Start in detached mode |
| `docker-compose down` | Stop containers (keeps data) |
| `docker-compose down -v` | Stop containers and delete database |
| `docker-compose logs -f server` | View server logs |

### Database Access (Docker)

```bash
# Query database
docker-compose exec server npx wrangler d1 execute chatbot --local --command "SELECT * FROM users"

# Interactive SQL mode
docker-compose exec server npx wrangler d1 execute chatbot --local --interactive

# Reset database (delete all data)
docker-compose exec server npx wrangler d1 execute chatbot --local --command "DELETE FROM sessions; DELETE FROM bots; DELETE FROM users;"
```

---

## Local Development (Without Docker)

### Step 1: Install Dependencies

```bash
# Install server dependencies
cd server
nvm use
npm install

# Install client dependencies
cd ../client
nvm use
npm install
```

### Step 2: Environment Variables

#### Server Configuration

Update `server/.env` with your Gemini API key:

```dotenv
GEMINI_API_KEY=your_google_generative_ai_api_key
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:5173
```

#### Client Configuration

The `client/.env.development` is pre-configured:

```dotenv
VITE_API_URL=http://localhost:3000
```

### Step 3: Run the Application

Open two terminal windows:

**Terminal 1 - Server:**
```bash
cd server
nvm use
npm start
```
Server runs at http://localhost:3000

**Terminal 2 - Client:**
```bash
cd client
nvm use
npm run dev
```
Client runs at http://localhost:5173

### Database Access (Local Dev)

```bash
cd server

# Query database
npx wrangler d1 execute chatbot --local --command "SELECT * FROM users"

# Interactive SQL mode
npx wrangler d1 execute chatbot --local --interactive

# Run migrations
npx wrangler d1 execute chatbot --local --file ./migrations/0001_init.sql
```

---

## Deployment to Cloudflare

### Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Wrangler CLI authenticated: `npx wrangler login`

### Step 1: Create D1 Database

```bash
cd server

# Create production database
npx wrangler d1 create chatbot

# Copy the database_id from the output
```

### Step 2: Update wrangler.toml

Update `server/wrangler.toml` with your production values:

```toml
name = "chat-service-api"
main = "src/index.ts"
compatibility_date = "2025-01-12"

[[d1_databases]]
binding = "DB"
database_name = "chatbot"
database_id = "YOUR_DATABASE_ID"  # From step 1

[vars]
GEMINI_API_KEY = "your-production-api-key"
GEMINI_MODEL = "gemini-2.5-flash"
FRONTEND_URL = "https://your-frontend-domain.com"
```

### Step 3: Run Migrations on Production

```bash
cd server
npx wrangler d1 execute chatbot --remote --file ./migrations/0001_init.sql
```

### Step 4: Deploy Server

```bash
cd server
npm run deploy
```

Your API will be available at: `https://chat-service-api.YOUR-ACCOUNT.workers.dev`

### Step 5: Deploy Client

Update `client/.env.production`:

```dotenv
VITE_API_URL=https://chat-service-api.YOUR-ACCOUNT.workers.dev
```

Build and deploy:

```bash
cd client
npm run build
npx wrangler pages deploy dist
```

### Verify Deployment

```bash
# Test server health
curl https://chat-service-api.YOUR-ACCOUNT.workers.dev/health

# Test registration
curl -X POST https://chat-service-api.YOUR-ACCOUNT.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/me` | Get current user |

### Bots
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bots` | List user's bots |
| GET | `/bots/:id` | Get bot details |
| POST | `/bots` | Create new bot |
| DELETE | `/bots/:id` | Delete bot |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/:botId` | Send message to bot |

### Widget
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/widget.js` | Get embed script |

---

## Product Demo Flow

1. **Register/Login**: Create an account or login at http://localhost:5173
2. **Create Bot**: Go to the dashboard, enter a name and instructions
3. **Get Embed Code**: Click "Get Embed Code" to copy the widget script
4. **Test Widget**: Click "Test Widget" to chat with your bot

## Screenshots

- **Dashboard:** Create and manage bots  
![Bot dashboard](docs/chatbot-as-a-service-bot-dashboard.png)

- **Chat Widget:** Interact with your bot  
![Chat widget test](docs/chatbot-as-a-service-bot-test.png)

---

## Project Structure

```
chat-as-a-service/
├── client/                 # React frontend
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── server/                 # Hono backend
│   ├── src/
│   ├── migrations/
│   ├── Dockerfile
│   ├── wrangler.toml
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, TypeScript
- **Backend**: Hono, Cloudflare Workers, D1 (SQLite)
- **AI**: Google Gemini
- **Deployment**: Cloudflare Workers & Pages