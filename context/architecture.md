# Architecture Context

## Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | Next.js 16 + TypeScript | SSR/SSG React framework |
| UI | Tailwind CSS v4 + shadcn/ui | Styling system + component primitives |
| Animation | Motion (Framer Motion) + GSAP | Scroll reveals, micro-interactions |
| Icons | lucide-react | Icon system |
| Fonts | Geist Sans + Geist Mono (default) | Primary and monospace typefaces |

## Frontend Structure — Feature-First

```
src/
├── app/                          # Next.js App Router (routes, layouts, providers)
│   ├── layout.tsx                # Root layout (fonts, metadata, providers)
│   ├── page.tsx                  # Home page (thin composition layer)
│   └── (routes)/                 # Route groups for organized pages
├── features/                     # Feature modules (self-contained, domain-driven)
│   ├── auth/                     # Example: Authentication feature
│   │   ├── api/                  # API calls, mutations, queries
│   │   ├── components/           # Feature-specific UI (LoginForm, AuthGuard)
│   │   ├── hooks/                # Feature-specific hooks (useAuth, useSession)
│   │   ├── types/                # Domain types (User, Session)
│   │   └── index.ts             # Public API — only exports from here
│   ├── billing/
│   └── dashboard/
├── shared/                       # Business-agnostic reusable code
│   ├── ui/                       # Design system primitives (Button, Input, Modal)
│   ├── hooks/                    # Generic hooks (useDebounce, useMediaQuery)
│   ├── lib/                      # Pure utilities (formatDate, cn, validators)
│   ├── api/                      # HTTP client, interceptors
│   └── types/                    # Shared types
├── entities/                     # Domain models shared across features
│   ├── user/
│   │   ├── api/
│   │   ├── model/                # Types, schemas, invariants
│   │   └── index.ts
│   └── organization/
├── lib/                          # Low-level infrastructure
│   ├── api-client.ts             # Axios / fetch client
│   ├── query-client.ts           # TanStack Query setup
│   └── logger.ts
├── config/                       # Runtime config, env vars, constants
└── styles/                       # Global styles, design tokens
    ├── globals.css
    └── tokens.css
```

## System Boundaries

- `src/app/` — Next.js App Router pages and layouts (server components by default, thin composition layer)
- `src/features/` — Feature modules with their own API, components, hooks, types (no cross-feature imports)
- `src/shared/ui/` — Design system primitives (buttons, inputs, dialogs, etc.)
- `src/shared/lib/` — Utility functions, formatters, validators
- `src/shared/api/` — HTTP client configuration, interceptors
- `src/entities/` — Domain models and business objects shared across features
- `src/lib/` — Low-level infrastructure (API client, query client, logging)
- `src/config/` — Runtime configuration, environment variables, constants
- `src/styles/` — Global CSS, design tokens
- `.agents/` — AI agent skills (embedded + installed)
- `context/` — Agent context files

## Dependency Direction

```
app/ (pages) → features/ → entities/ → shared/
app/ (pages) → features/ → shared/
features/ → shared/
features/ → entities/
entities/ → shared/

NEVER: features/ → features/ (cross-feature imports)
NEVER: shared/ → features/ or entities/
NEVER: entities/ → features/
```

## Component Library Protocol

1. Reference `DESIGN.md` for the curated list of allowed libraries
2. Check **Astryx (Meta)** first for standard UI patterns
3. Premium/animated sections: Animata, Cult UI, Skipper UI, React Bits Pro, Aceternity, MagicUI
4. Never use Mantine, Chakra, MUI, Ant Design
5. Prefer CLI-installable/copy-paste (own the code)

## Auth and Access Model

[Describe auth — authentication, authorization, public vs private routes]

## Invariants

1. All components are server-renderable by default — add `'use client'` only when browser interactivity requires it
2. Animations only affect `transform` and `opacity` — never layout properties
3. All colors use CSS custom properties — no hardcoded values
4. Every animation has a `prefers-reduced-motion` fallback
5. Components stay single-purpose and under 300 lines
6. Features never import from other features — use `entities/` or `shared/` for shared concerns
7. Every feature exposes a public API through `index.ts` — no deep imports into feature internals
8. No `npx install --force` or `npm install --force` — resolve conflicts properly