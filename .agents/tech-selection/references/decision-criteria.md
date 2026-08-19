# Decision Criteria — Per-Layer Comparison Tables

Use these when the tech-selection skill asks you to weigh options. Adapt the weights
to the user's actual requirements (scale, team, deadlines).

## Language

| Option | Best for | Trade-offs |
|--------|----------|------------|
| TypeScript | Web/fullstack, typed APIs, shared contracts | compile step, type ceremony |
| Python | Data/ML, scripting, FastAPI/Django backends | runtime speed, typing optional |
| Go | High-throughput services, CLIs, infra | fewer skills, more boilerplate |
| Java/Kotlin | Enterprise, long-lived teams | slow iteration, heavy tooling |
| Dart | Flutter apps | single-ecosystem lock-in |

## Frontend Framework

| Framework | When | Don't when |
|-----------|------|------------|
| Next.js | SSR/SEO, marketing+app hybrid, team knows React | pure SPA already decided |
| Vite + React | SPA/dashboard, admin tools, fast startup | SEO-critical public pages |
| Astro | Content-heavy marketing sites | complex app UIs |
| Svelte/SvelteKit | smaller bundles, Svelte-fluent teams | niche hiring, young ecosystem |
| Plain HTML/CSS | simple static pages | anything interactive |

## Backend

| Options | Use when | Avoid when |
|---------|----------|------------|
| Next.js API routes | colocated backend, serverless-ish, same team | separate heavy workers |
| Express/Fastify | classic Node API, control | needs lots of structure → add patterns |
| NestJS | enterprise, DI+batteries | small quick APIs |
| FastAPI (Python) | rapid APIs, ML integration | Node-only teams |
| Django | admin-heavy, batteries-included | lightweight APIs |

## Database

| Choice | Nature | Use when |
|--------|--------|----------|
| Postgres | relational | default for relational data |
| MySQL | relational | existing infra, MySQL-familiar team |
| SQLite | embedded | local/single-user/dev, zero-ops |
| MongoDB | document | flexible schemas, heavy read/write CRUD |
| Redis | cache/queue | hot reads, rate limits (with primary DB) |
| DynamoDB | serverless | huge scale, AWS-locked |

## Styling (within template rules)

| Choice | Use when |
|--------|----------|
| Tailwind v4 | default — tokens + utility, design-system friendly |
| shadcn/ui | copy-paste components, own the code |
| CSS Modules | component-scoped, no framework |
| styled-components | CSS-in-JS team |
| vanilla CSS | minimal project |

## State Management

| Choice | When |
|--------|------|
| TanStack Query | server state is the majority — almost always |
| zustand | light client state, no boilerplate |
| Redux | legacy codebases, large sync client state |
| Context | tiny apps; reseed when state grows |

## Validation & Types (TS frontend/backend)

- **zod** — schema + inference; shares types between frontend and backend
- **Pydantic** — Python; schemas + validation, FastAPI-native
- **class-validator** — decorator-based (NestJS)

## Testing

| Framework | Layer |
|-----------|-------|
| Vitest | unit/component test (fast, TS native) |
| Jest | standard, more legacy config |
| Playwright | E2E browser flows |
| Testing Library | component behavior |
| pytest | Python unit |

## Deployment

| Where | Use when |
|-------|----------|
| Vercel | Next.js web, serverless, zero-ops |
| Netlify | static frontend, JAMS |
| Railway / Fly | simple API + DB containers |
| AWS (ECS/K8s/Lambda) | needs deep infra control, compliance |
| Docker on VPS | cheap, self-managed |
| Expo EAS / App Store | mobile releases |

## Final Answer Template

Present as:

| Layer | Choice | Why (1 line) |
|-------|--------|--------------|

Then a decision record for the TOP 2-3 consequential calls (DB, framework, deploy).