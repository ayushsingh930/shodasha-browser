---
name: folder-structure
description: >
  Use ONLY when setting up a new project, creating/deriving the folder structure,
  deciding where files should live, or scaffolding a new stack (frontend, backend,
  fullstack, mobile, monorepo). Prevents AI hallucinated folder trees by providing
  canonical, production-proven structure templates. The canonical trees in this skill
  are the source of truth — create the folders by hand from them (npm/create-app
  provides the boilerplate, this skill provides the hierarchy). Do NOT use for UI
  design, performance tuning, or security.
trigger: >
  User starts a new project, asks "what folder structure should I use", asks where a
  file/component/service belongs, wants to scaffold a new stack, or says "set up the
  project structure". Also when Agent.md's Project Structure section doesn't cover the
  stack being created.
avoid_trigger: >
  Styling/design decisions, color palettes, component libraries, animation, security
  hardening, performance optimization, writing feature logic.
---

# Folder Structure Skill — Derive the Right Structure Before You Code

## Purpose

A wrong folder structure is the #1 cause of AI hallucination: files land in random places, imports break, and the project becomes unmaintainable. This skill fixes the structure FIRST so every subsequent skill and code generation has a canonical home for every file.

## When to Use

- Setting up the structure of a brand-new project (after `npm install` / create-app boilerplate)
- User asks "where should X live?" or "set up the project structure"
- A feature/component is being added and needs a home
- Converting between stacks (web → mobile, backend-only → fullstack)

## Step 0 — Size the Structure to the Product (Do this BEFORE generating)

Classify the product (cross-check the `tech-selection` skill) and only build the folders
the product actually needs:

| Product reality | Minimum structure |
|-----------------|-------------------|
| Marketing / landing site | `app/` + `shared/ui` + `config/` + `styles/`. NO features/entities layers |
| Simple client tool | `app/` + `components/` + `hooks/` (+ `lib/` if reused) |
| Interactive web app | full `features/` tree below |
| Fullstack app | the full tree below (frontend + backend + shared) |
| Mobile / desktop | mobile/desktop tree below |
| Monorepo | ONLY if 2+ apps genuinely share code |

Rules:

- **No folder exists without a file to put in it.** Create layers as features appear —
  don't pre-create `features/billing/` for a product with no billing.
- **Start with the thin skeleton**, let the feature-first pattern grow it. Only create
  the folders the product actually needs.
- **Never invent modules.** If the user hasn't mentioned surveys, there is no
  `features/surveys/` until they actually ask.

## Step 1 — Determine the Stack

Ask yourself (or the user, if unclear):

| Question | Options |
|----------|---------|
| What kind of app? | web frontend / backend API / fullstack / mobile / monorepo |
| Language? | TypeScript (default), Python, Java, Go, etc. |
| Framework? | Next.js, Express, Fastify, NestJS, Spring, Django, etc. |
| Scale? | small/medium/large (monorepo is only for large, multi-app, shared-package needs) |

## Step 2 — Materialize the Canonical Structure

The boilerplate (`npm install`, create-app, etc.) gives you a base project. You impose
this project's hierarchy on top of it. **Copy the canonical tree for your stack (Step 3
below) and create the folders and stub files with your editor or terminal.** Create only
the folders the product actually needs (per Step 0). Do not invent a new structure.

```
mkdir -p src/app src/config src/styles src/shared/{ui,hooks,lib,api,types} src/entities src/features
```

Valid stacks: `frontend`, `backend`, `fullstack`, `mobile`, `monorepo`.

## Step 3 — Canonical Trees (Source of Truth)

### Frontend — Feature-First + Layered (Recommended)

```
src/
├── app/                          # Next.js App Router — routes, layouts, providers (THIN)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── config/                       # runtime config, env vars, constants
├── features/                     # one folder PER FEATURE (self-contained)
│   └── auth/
│       ├── model/                # types, interfaces, schemas, DTOs
│       ├── config/               # feature-specific constants/config
│       ├── service/              # API calls, network logic (one file per resource)
│       ├── controller/           # state orchestration: hooks, stores, context
│       ├── repository/           # data access: query client, caching, optimistic updates
│       ├── components/           # feature-specific UI
│       ├── hooks/                # feature-specific react hooks
│       └── index.ts              # PUBLIC API — only exports from here
├── entities/                     # shared domain models (User, Product, Org)
│   └── user/
│       ├── model/
│       └── index.ts
├── shared/                       # business-agnostic reusable code
│   ├── ui/                       # design system primitives
│   ├── hooks/
│   ├── lib/                      # pure utilities
│   ├── api/                      # HTTP client, interceptors
│   └── types/
└── styles/                       # globals.css, tokens.css
```

### Backend — Controller-Service-Repository

```
src/
├── controllers/                  # HTTP layer: parse request, format response, call service
├── services/                     # business logic: rules, orchestration, transactions
├── repositories/                 # data access: queries, DB, external APIs
├── models/                       # entities, ORM models, schemas
├── middleware/                   # auth, rate-limit, logging, error handling
├── validators/                   # request validation (zod, joi, class-validator)
├── routes/                       # route definitions → controller mapping
├── config/                       # env, DB connection, third-party setup
├── utils/                        # pure helpers
├── types/                        # shared types
├── app.ts                        # express app assembly
└── index.ts / server.ts          # entry point
```

### Fullstack

```
client/     ← exactly the Frontend tree above
server/     ← exactly the Backend tree above
shared/     ← types + contracts used by both (API DTOs, enums)
```

### Mobile (React Native / Flutter-agnostic)

```
src/
├── app/                         # navigation root / tabs
├── screens/                     # one folder per screen
├── components/                  # reusable UI
├── navigation/                  # route definitions
├── services/                    # API + external services
├── repositories/                # data access, local cache
├── controllers/                 # state management (stores, providers)
├── models/                      # domain types
├── config/
├── store/                       # global state
└── utils/
```

### Monorepo (only for large multi-app needs)

```
apps/
├── web/                         # frontend tree
└── api/                         # backend tree
packages/
├── config/                      # shared configs (tsconfig, eslint)
├── types/                       # shared types
├── contracts/                   # shared API contracts
└── utils/                       # shared helpers
pnpm-workspace.yaml
```

## Step 4 — Rules That Apply to EVERY Structure

1. **Dependency direction only one way**: `app → features → entities → shared`. Never let `shared` know about `features`.
2. **No cross-feature imports.** Feature A never imports Feature B — promote shared code to `entities/` or `shared/`.
3. **Every feature has a public `index.ts`.** Never deep-import into feature internals.
4. **Co-locate by domain**, not by type: a component's styles/test/types live next to it.
5. **Promote to `shared/` only on second use** — premature abstraction is a design smell.
6. **`app/` pages are thin composition layers** — no business logic in page files.
7. **Match the stack, not the habit.** Don't force a Next.js structure onto a NestJS backend.
8. **Model → Config → Service → Controller → Repository** layering applies per-feature: model defines data shape, service talks to the network, repository manages persistence/cache, controller wires state + UI logic.

## Step 5 — Verifying a Proposed Structure

Before accepting any AI-generated folder tree, check:

- [ ] Every file type has exactly one obvious home
- [ ] Dependency arrows never point backward
- [ ] No `components/` or `utils/` dumping grounds at the root (frontend)
- [ ] Each feature folder contains `model/config/service/controller/repository` or equivalent layered subfolders
- [ ] `index.ts` is the only public entry point per module

## Files in This Skill

```
folder-structure/
├── SKILL.md              ← this file (entry point)
└── references/
    ├── frontend.md       ← frontend structure in depth
    ├── backend.md        ← backend structure in depth
    ├── mobile.md         ← mobile structure in depth
    └── monorepo.md       ← monorepo structure in depth
```

## Handoff

Once the structure is created:

1. Update `context/architecture.md` with the chosen structure
2. Keep the folders you created in sync with the canonical tree in this skill
3. THEN load the relevant implementation skills (design-patterns, ssdlc, etc.)
