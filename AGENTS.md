# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts the Next.js 15 App Router tree; route groups mirror user flows. Keep server actions in `app/actions` and shared layouts in `app/(shared)/`.
- `components/` contains reusable UI built on shadcn/Radix; colocate variants, hooks, and accompanying styles in the same subfolder.
- `lib/` stores pure utilities (API clients, formatting helpers). Anything that touches browser APIs should stay inside `app/` or `components/`.
- Static assets live in `public/`; Cloudflare bindings and runtime contracts are captured in `cloudflare-env.d.ts`, `wrangler.jsonc`, and `open-next.config.ts`.

## Build, Test, and Development Commands
- `npm run dev` — start Turbopack dev server with live reload.
- `npm run build` — create a production bundle (used by `npm run deploy`).
- `npm run start` — serve the previously built bundle locally.
- `npm run lint` — run ESLint with `eslint.config.mjs` to enforce style rules.
- `npm run deploy` / `npm run preview` — build via OpenNext and deploy or preview on Cloudflare Workers.
- `npm run cf-typegen` — regenerate typed bindings for Cloudflare environment variables.

## Coding Style & Naming Conventions
Use TypeScript everywhere; prefer server components unless the UI needs client-side hooks (mark with `"use client"`). Stick to 2-space indentation, camelCase for helpers, PascalCase for React components, and kebab-case for file names. Leverage Tailwind v4 utilities plus `clsx`/`tailwind-merge`; avoid inline styles. Run `npm run lint` before every push; rely on ESLint + Next rules instead of ad-hoc formatting.

## Form Handling & Validation
For all user input forms (including file uploads, text inputs, and data entry), use **TanStack Form** (`@tanstack/react-form`) for form state management and **Zod** for schema validation. This ensures type-safe, performant form handling with consistent validation patterns across the application.

- Define Zod schemas in the same file as the form component or in a shared `lib/validations/` directory for reusable schemas.
- Use TanStack Form's `useForm` hook with Zod adapter (`@tanstack/zod-form-adapter`) for seamless integration.
- Leverage Zod's built-in validators and custom refinements for complex validation logic (e.g., file size limits, format checks).
- For file uploads, validate file types, sizes, and other constraints using Zod schemas before submission.
- Keep form logic in client components (`"use client"`); use server actions for form submission and data persistence.

Example pattern:
```typescript
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  file: z.instanceof(File).refine(...)
})

// Use with TanStack Form
```

## Testing Guidelines
Automated tests are not yet wired up; add coverage (React Testing Library or Playwright) or provide a concise QA note. Name future tests `*.test.tsx` and colocate them with the component they exercise. At minimum, run `npm run lint` and validate critical flows locally via `npm run dev`.

## Commit & Pull Request Guidelines
Follow the existing history style: present-tense, descriptive summaries (e.g., "Enhance PrepUp platform"). Reference related issues in the body, list key changes, and note any config or schema updates. Pull requests should include screenshots or Looms for UI changes, deployment considerations for Cloudflare, and confirmation that `npm run lint`/`npm run build` succeed. Request review before merging to protect the main branch.

## Security & Configuration Tips
Keep API keys in Wrangler secrets or Cloudflare dashboard; never commit `.env` files. When adding bindings, update `cloudflare-env.d.ts` and `wrangler.jsonc` so type generation stays accurate. Revisit `middleware.ts` whenever authentication or routing rules change.
