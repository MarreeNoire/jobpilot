# JobPilot

AI-powered job application assistant that helps users manage their job search and automate applications with AI agent and browser extension.

## Architecture

This project uses a monorepo structure with TurboRepo:

- `apps/web` - Next.js frontend application
- `apps/api` - Node.js backend API
- `apps/extension` - Chrome extension (Manifest V3)
- `packages/database` - Prisma ORM and database configuration
- `packages/ai` - AI provider abstraction and implementations
- `packages/shared` - Shared types, utilities, and constants
- `packages/validation` - Input validation schemas
- `packages/config` - Configuration management

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL
- Redis
- Ollama (for local AI models)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in the required values
4. Set up PostgreSQL and Redis
5. Start Ollama and pull a model: `ollama pull llama2`
6. Run database migrations: `npm run db:push` (from api workspace)
7. Start development: `npm run dev`

## Development

- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run format` - Format code with Prettier

## Documentation

See `docs/` for detailed architecture and roadmap.

## License

MIT