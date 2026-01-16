# Chat as a Service - Client

React + Vite frontend for the Chat as a Service application.

## Setup

### Prerequisites
- Node.js v22.14.0
- Server running at `http://localhost:3000` (see main README for instructions)

### Install Dependencies

```bash
nvm use
npm install
```

### Environment Variables

The `.env.development` file is pre-configured for local development:

```dotenv
VITE_API_URL=http://localhost:3000
```

This points to the local server. For production, use `.env.production`.

### Development Server

```bash
nvm use
npm run dev
```

The client will be available at [http://localhost:5173](http://localhost:5173).

### Build for Production

```bash
npm run build
```

### Other Commands

- **Format code**: `npm run format`
- **Lint code**: `npm run lint`
- **Type check**: `npm run type-check`
- **Preview build**: `npm run preview`

## Features

- User authentication (register/login)
- Create and manage chatbots
- Real-time chat with bots powered by Google Gemini
- Embed widget for external websites
- Dashboard for bot management

## Architecture

This is a Vite-based React application using:
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **Axios** for API requests
- **TypeScript** for type safety
