---
name: tech-selection
description: >
  Use ONLY when deciding which technologies to use for a project or feature: framework,
  language, database, styling, state management, testing, deployment. Converts a vague
  product idea into a concrete, justified tech stack using decision criteria. Prevents
  AI from defaulting to random libraries. Do NOT use for UI design or folder layout.
trigger: >
  User says "which tech should I use", "what framework", "decide the stack",
  "should I use X or Y", or starts a new project with an idea but no stack.
avoid_trigger: >
  Visual design, folder structure, code generation, security review.
---

# Tech Selection Skill — Decide the Stack on Purpose

## Purpose

The AI default is to grab whatever library is fashionable or whatever the template
mentions — and to add a backend, a database, and five libraries even when the product
is a single marketing page. This skill forces the agent to **first understand what it
is actually building**, then pick the **smallest stack that does the job**. Every
choice has a reason; nothing is defaulted; nothing extra is added.

## When to Use

- New project kickoff — before scaffolding
- User asks to compare technologies
- A feature needs a new library — decide first, install second
- Template defaults don't fit the user's real needs (e.g., offline mobile app)

## Workflow

### Step 0 — Classify the Product (MANDATORY — do this FIRST)

Before any technology choice, answer exactly one thing: **what kind of product is
this?** Invert the default: assume the *smallest* thing that could work, then validate
each layer upward.

| Product type | Does it need a backend? | Does it need a DB? | Typical stack |
|--------------|------------------------|--------------------|---------------|
| Marketing / single page site | No | No | Next.js static + Tailwind only |
| Client-only tool (calculator, portfolio demo) | No | No | Vite/Next + state in-app, no server |
| Interactive web app (dashboards, forms, settings) | Yes | Maybe (start without, add when needed) | Next.js fullstack |
| Fullstack product-service (auth, billing, surveys, teams) | Yes | Yes | Next.js + DB + services |
| Mobile app | Only if data is shared | Maybe (SQLite local vs server) | React Native/Expo + shared API |
| Desktop app | Only if data is shared | Local store | Electron/Tauri or native |
| API/microservice | Yes (it IS the backend) | Yes | Fastify/Express/FastAPI |

Then ask the user the minimum set (only what the classification left open):

1. Who uses it & how many? (tens vs millions — changes sizing)
2. Offline / desktop / mobile requirement?
3. Team skill set + deadline?
4. Real constraints: compliance, budget, existing infra?

**Anti-hallucination rule:** if the product is a single-page site, you must NOT invent
auth, a database, an admin panel, or a monorepo. If the product is mobile, you must
start with the mobile branch, not copy the web stack.

### Step 1 — Decide Each Layer with Criteria

For every layer, list candidate options, then score against the criteria gathered in
Step 0. **Never pick without comparing at least 2-3 options.**

| Layer | Decision | Criteria to weigh |
|-------|----------|-------------------|
| Language | TS, Python, Go, Java, Swift/Kotlin, Dart | team, ecosystem, performance, hiring |
| Frontend | Next.js, Vite+React, Vue, Svelte, Astro, plain HTML | SSR/SEO needs, interactivity, team |
| Backend | Next.js API routes, Express, Fastify, NestJS, FastAPI, Django, Go | complexity, typing, perf, team |
| Database | Postgres, MySQL, SQLite, MongoDB, Redis (cache), serverless DB | data shape, scale, consistency needs |
| Styling | Tailwind, CSS modules, shadcn/ui, styled-components, plain CSS | design needs, tokens, team |
| State | TanStack Query, zustand, Redux, context | server-state vs client-state mix |
| Testing | Vitest/Jest, Playwright, Testing Library, pytest | coverage goals, stack |
| Deploy | Vercel, Netlify, Railway, Fly, AWS, Docker/K8s, serverless | ops capability, scale, budget |
| Monorepo? | none / pnpm+turbo | multi-app need, shared code |

### Step 2 — Apply the Default Sane Stack (Template Alignment)

When the user has no strong preference, align with the template's proven defaults —
**but only the layers your classification in Step 0 actually needs**:

- **Web frontend**: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui (per DESIGN.md)
- **Backend** (only if classified as fullstack/API): TypeScript (Express/Fastify) or
  Python (FastAPI) with Controller-Service-Repository, or Next.js API routes
- **Database** (only if data is real + shared): Postgres; Redis only when caching is proven
- **State**: TanStack Query for server state, zustand for light client state
- **Validation**: zod (TS) / Pydantic (Python)
- **Testing**: Vitest + Playwright
- **Package manager**: pnpm (npm acceptable per team)

**Right-size example:**
- Marketing page → Next.js static, NO database, NO auth, NO TanStack Query.
- Simple client tool → frontend + in-memory/local storage only.
- Fullstack survey product → Next.js + Postgres + auth, THEN add layers as demands appear.

### Step 3 — Document the Decision (Decision Record)

Output a **Decision Record** with: decision, alternatives considered, criteria,
rationale, risks, and what would change the decision:

```markdown
## Decision: Postgres over MongoDB for survey storage

**Alternatives**: MongoDB, DynamoDB
**Criteria**: relational survey data + per-user analytics, transactional integrity,
team familiarity
**Rationale**: survey results are relational (users→surveys→questions→answers),
needs joins + aggregation, team knows SQL
**Risks**: schema migrations cost — mitigated by Prisma/Alembic
**Change trigger**: if scale exceeds single-writer limits → partition/queue redesign
```

### Step 4 — Confirm with the User

Present the stack table + decision record. Get approval BEFORE scaffolding.

## Rules

1. **Classify the product before anything else.** (Step 0) A marketing page, a fullstack app, and a mobile app are three different products with three different stacks. Never treat them as the same task.
2. **Pick the SMALLEST stack that does the job.** Every layer that adds a DB, backend, state library, or infra needs a reason.
3. **No defaulting without a reason.** If you pick something, you can name the criteria that beat the alternatives.
4. **Prefer boring, proven technology** for business-critical stuff. The template defaults are the baseline; deviate only with justification.
5. **Ask before recommending exotic choices** (new frameworks, niche DBs).
6. **Think migration-free** — a choice that's hard to back out of needs stronger justification.
7. **Document every decision** — future agents and teammates need the why.
8. **Respect template rules** — e.g., no Mantine/Chakra/MUI/Ant Design in this template.
9. **Do not add layers the product doesn't need.** No auth without users. No DB without data. No monorepo without multiple apps.

## Files in This Skill

```
tech-selection/
├── SKILL.md              ← this file (entry point)
└── references/
    └── decision-criteria.md   ← per-layer comparison tables
```

## Handoff

- Chosen stack → `folder-structure` skill (structure per stack)
- Architecture patterns for the stack → `design-patterns` skill
- Save the decision record to `context/architecture.md`
