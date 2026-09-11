# JobPilot Architecture

## Overview

JobPilot is a monorepo-based full-stack application designed to help users manage their job search and automate job applications using AI agents and a browser extension.

## Monorepo Structure

```
/apps
  /web          - Next.js frontend application
  /api          - Node.js backend API
  /extension    - Chrome extension (Manifest V3)
/packages
  /database     - Prisma ORM and database configuration
  /ai           - AI provider abstraction and implementations
  /shared       - Shared types, utilities, and constants
  /validation   - Input validation schemas using Zod
  /config       - Configuration management
/docs           - Documentation
/scripts        - Utility scripts
```

## Key Components

### 1. Frontend (Next.js App)

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Features**:
  - User authentication
  - Profile management
  - Job search and tracking
  - Application dashboard
  - Resume and cover letter management

### 2. Backend (Node.js API)

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Features**:
  - RESTful API endpoints
  - Authentication and authorization
  - Job analysis service
  - AI provider integration
  - Application processing
  - Webhook handling for extension communication

### 3. AI Provider Abstraction

- **Interface**: `AIProvider` defining core AI operations
- **Implementation**: `OllamaProvider` (default)
- **Future Extensibility**: Designed to support OpenAI, Anthropic, Google, etc.
- **Operations**:
  - Job analysis
  - Match calculation
  - Cover letter generation
  - Application question answering

### 4. Browser Extension (Chrome Manifest V3)

- **Components**:
  - Background service worker
  - Content script
  - Popup UI
- **Features**:
  - Job information extraction
  - Form filling capabilities
  - Communication with backend
  - Platform adapter pattern for extensibility

### 5. Database Design

- **Core Entities**:
  - User, Profile, Experience, Education, Skill
  - Resume, CoverLetter, JobPreference
  - Job, JobAnalysis
  - Application, ApplicationAnswer
  - AutomationRule, AutomationLog
  - Notification
- **Relationships**: Properly normalized with foreign keys
- **Enums**: Application statuses and other categorical data

### 6. Communication Flow

1. User interacts with frontend or extension
2. Frontend/extension communicates with backend API
3. Backend processes requests, potentially using AI providers
4. Backend stores/retrieves data from PostgreSQL
5. For extension-initiated actions:
   - Content script extracts job info
   - Background worker communicates with popup
   - Popup sends requests to backend
   - Backend processes and responds

### 7. Extensibility Points

- **AI Providers**: Abstract interface allows swapping implementations
- **Platform Adapters**: Extension designed to support multiple job platforms
- **Authentication**: Modular auth system
- **Storage**: Abstracted storage layer for S3-compatible providers

## Data Flow Examples

### Job Analysis Flow

1. User views job posting or inputs job details
2. Extension extracts job information or user submits via frontend
3. Backend receives job data
4. Backend sends to AI Provider (`analyzeJob` method)
5. AI Provider processes with LLM and returns structured analysis
6. Backend stores analysis and returns to user
7. Frontend displays analysis and compatibility score

### Application Flow

1. User decides to apply for a job
2. System gathers user profile, resume, and job analysis
3. AI Provider generates cover letter and answers questions
4. Extension fills form with collected data
5. User reviews and confirms application
6. Extension submits form (if possible) or guides user
7. Backend records application status and notifications

## Security Considerations

- Environment variables for secrets
- Password hashing (bcrypt)
- JWT-based authentication
- Input validation with Zod
- CORS and helmet middleware
- Secure file upload handling
- SQL injection prevention via Prisma ORM
- XSS protection in frontend

## Deployment Considerations

- Separate deployment for frontend, backend, and extension
- Database migrations with Prisma
- Environment-specific configuration
- Redis for caching and queues
- Storage service for file uploads