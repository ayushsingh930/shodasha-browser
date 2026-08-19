# Code Standards

## General

- Keep components small and single-purpose (max ~300 lines)
- Fix root causes — do not layer workarounds
- Do not mix unrelated concerns in one component or route
- Never use `npm install --force` or `npx install --force` — resolve dependency conflicts properly
- Never default to a single UI library — mix and match from DESIGN.md

## TypeScript

- Strict mode is required throughout the project
- Avoid `any` — use explicit interfaces or narrowly scoped types
- Validate unknown external input at system boundaries
- Prefer `interface` over `type` for object shapes; use `type` for unions, intersections, and aliases

## Framework

- Default to server components — add `'use client'` only when browser interactivity requires it
- Use framework-native image/image optimization components
- Keep route handlers focused on a single responsibility
- Every page gets metadata/SEO (title, description, Open Graph tags)

## Frontend — Feature-First Organization

- **Every feature is a self-contained module** in `src/features/<feature-name>/`
- Feature modules own: `api/`, `components/`, `hooks/`, `types/`, and `index.ts`
- **No cross-feature imports** — if two features need shared code, promote to `entities/` or `shared/`
- **Public API via `index.ts`** — external code imports only from the feature root
- **`app/` pages are thin composition layers** — they import from features, not contain business logic
- **`shared/` is business-agnostic** — no feature-specific code
- **`shared/ui/`** contains primitives (Button, Modal, Input) — no business names
- **Promote to `shared/` only on second use** — avoid premature abstraction

## Backend — Service-Repository Pattern

- **Controllers** handle HTTP: parse request, validate, call service, format response
- **Services** contain business logic: orchestration, rules, workflows
- **Repositories** handle data access: DB queries, external API calls
- **Validators** define request schemas (Zod, Yup)
- **Middleware** handles cross-cutting concerns: auth, rate limiting, logging

## Styling

- Use CSS custom property tokens — no hardcoded color values
- Follow the design token / spacing scale defined in `ui-context.md`
- Keep utility classes inline; avoid preprocessor features like `@apply`

## Animation

- Animate only `transform` and `opacity` — never layout properties
- Never animate from `scale(0)` — start from `scale(0.95)` with `opacity: 0`
- Never use `ease-in` for UI animations — use `ease-out` with custom cubic-bezier
- UI animations stay under 300ms
- Respect `prefers-reduced-motion` on every animated element

## File Organization

```
src/
├── app/                          # Next.js routes and layouts
├── features/                     # Feature modules (api/, components/, hooks/, types/, index.ts)
├── shared/                       # Shared UI, hooks, lib, api client, types
├── entities/                     # Domain models (user, product, organization)
├── lib/                          # Infrastructure (api-client, query-client, logger)
├── config/                       # Runtime config, env vars, constants
└── styles/                       # Global styles, design tokens
```

## Pre-Commit Checks (Every Feature Unit)

1. Lint passes (e.g., `npm run lint`)
2. Typecheck passes (e.g., `npm run typecheck`)
3. Build passes (e.g., `npm run build`)
4. `progress-tracker.md` is updated with completed work
5. All animations have `prefers-reduced-motion` fallbacks
6. No hardcoded colors — all values use CSS custom properties
7. No `components/` dumping ground — code is organized by feature
8. No cross-feature imports — shared code is properly promoted