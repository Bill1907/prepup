# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run lint             # Run ESLint

# Cloudflare Deployment
npm run deploy           # Build and deploy to Cloudflare Workers
npm run preview          # Preview Cloudflare build locally
npm run cf-typegen       # Generate Cloudflare environment types

# Hasura (Local GraphQL)
docker-compose --env-file .env.local up -d   # Start Hasura with Neon connection
docker-compose down                           # Stop Hasura
# Console: http://localhost:8080 (Admin Secret: HASURA_ADMIN_SECRET)
```

## Architecture Overview

### Platform
Next.js 16 App Router deployed on Cloudflare Workers via OpenNext. Uses Neon PostgreSQL for database, Hasura for GraphQL API, and Cloudflare R2 for file storage.

### Authentication & Protected Routes
Clerk handles auth. The middleware at [middleware.ts](middleware.ts) protects all `/service/*` routes.

### Database Layer
- **Neon PostgreSQL**: Primary database (production branch: `br-flat-fog-a1tpbpze`)
- **Hasura GraphQL**: GraphQL engine connected to Neon (http://localhost:8080)
- **Tables**: users, resumes, resume_history, interview_questions, mock_interview_sessions, interview_answers, subscriptions, user_notes, usage_stats

### Data Fetching Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (React)                         │
├─────────────────────────────────────────────────────────────┤
│  hooks/use-resumes.ts    │  hooks/use-questions.ts          │
│  (TanStack Query)        │  (TanStack Query)                │
└──────────────┬───────────┴───────────────┬──────────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│              lib/graphql/client.ts (graphql-request)        │
├─────────────────────────────────────────────────────────────┤
│  queries/resumes.ts      │  queries/questions.ts            │
│  - GET_RESUMES           │  - GET_QUESTIONS                 │
│  - CREATE_RESUME         │  - CREATE_QUESTIONS              │
│  - SOFT_DELETE_RESUME    │  - TOGGLE_BOOKMARK               │
│  - UPDATE_RESUME_ANALYSIS│  - DELETE_QUESTION               │
└──────────────┬───────────┴───────────────┬──────────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Hasura GraphQL Engine                      │
│              (http://localhost:8080/v1/graphql)             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Neon PostgreSQL                           │
│              (production branch: br-flat-fog-a1tpbpze)      │
└─────────────────────────────────────────────────────────────┘
```

### GraphQL Layer (Primary Data Access)
- **GraphQL Client**: `lib/graphql/client.ts` - graphql-request client for Hasura
- **Queries/Mutations**: `lib/graphql/queries/` - All GraphQL operations
  - `resumes.ts`: Resume CRUD, analysis results storage
  - `questions.ts`: Interview questions CRUD, bookmarks
- **Custom Hooks**: `hooks/` - TanStack Query hooks with optimistic updates
  - `useResumes()`, `useResume(id)`, `useResumeStats()`, `useDeleteResume()`
  - `useQuestions()`, `useQuestionStats()`, `useToggleBookmark()`, `useDeleteQuestion()`

### Server Actions (`app/actions/`)
Server Actions for AI operations using GraphQL for data persistence:
- `analyzeResume()` - OpenAI Assistants API for resume analysis → saves via GraphQL
- `generateQuestionsFromResume()` - AI question generation → saves via GraphQL
- `deleteResume()`, `toggleQuestionBookmark()`, `deleteQuestion()` - GraphQL mutations

### File Storage (Cloudflare R2)
- **R2 Bucket**: `prepup_files` for resume PDFs
- **File Keys**: `resumes/{clerkUserId}/{timestamp}-{filename}.pdf`
- **Access**: Presigned URLs via AWS4Fetch signing (`lib/db/index.ts`)
- **Functions**: `getPresignedUrl()`, `getFileData()`, `uploadFile()`, `listFiles()`

### API Routes (`app/api/`)
REST endpoints primarily for file operations and webhooks:
- `/api/resumes/upload/*` - File upload to R2
- `/api/resumes/[id]/download` - Presigned URL generation
- `/api/files/*` - Generic file serving
- `/api/webhooks/clerk` - Clerk webhook for user sync

### UI Components
shadcn/ui with Radix primitives in `components/ui/`. Uses Tailwind CSS 4.

## Key Bindings

### Cloudflare (wrangler.jsonc)
- `prepup_files`: R2 bucket for file storage
- `AI`: Cloudflare AI binding

### Neon PostgreSQL
- Project: `prepup` (`lingering-wildflower-84781300`)
- Branch: `production` (`br-flat-fog-a1tpbpze`)
- Database: `neondb`

## Environment Variables
Required in `.env.local`:
- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID` (for presigned URLs)
- `OPENAI_API_KEY` (for resume analysis)
- `NEON_DATABASE_URL` (PostgreSQL connection string)
- `HASURA_ADMIN_SECRET` (Hasura admin access)
- `NEXT_PUBLIC_HASURA_ENDPOINT` (GraphQL endpoint, default: http://localhost:8080/v1/graphql)
- `NEXT_PUBLIC_HASURA_ADMIN_SECRET` (for client-side GraphQL requests)

## Type Definitions
- `lib/graphql/queries/` - GraphQL response types and input types
- `cloudflare-env.d.ts`: Cloudflare environment bindings (auto-generated by `npm run cf-typegen`)

## Development Notes

### Adding New Database Fields
1. Add column in Hasura Console (connected to Neon)
2. Update GraphQL queries in `lib/graphql/queries/`
3. Update TypeScript types in the same file
4. Hasura auto-generates the GraphQL schema

### Legacy Code (lib/db/)
The `lib/db/` folder contains legacy Drizzle ORM code. For new development:
- **Use GraphQL** (`lib/graphql/`) for all database operations
- **Keep R2 functions** (`getPresignedUrl`, `getFileData`, etc.) from `lib/db/index.ts`
- API routes in `app/api/` may still use Drizzle - migrate to GraphQL as needed
