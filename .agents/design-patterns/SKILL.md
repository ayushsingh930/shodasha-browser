---
name: design-patterns
description: >
  Use ONLY when planning the software architecture before coding: deciding what
  classes/modules to create, how they interact, the request/response flow, applying
  design patterns (layered, repository, DI, factory, observer, etc.), how to debug
  the code, and how to make it production-ready (not just locally working). Provides
  universal architecture principles plus per-stack recipe cards. Do NOT use for UI
  visual design or folder-only decisions (see folder-structure skill).
trigger: >
  User says "design this feature", "what classes should I create", "how should these
  modules interact", "explain the request flow", "make it production ready", "how do I
  structure the business logic", or any architecture/design-pattern question BEFORE
  writing code.
avoid_trigger: >
  Visual/UI design (colors, typography, spacing), folder hierarchy only, security
  audits (use ssdlc), performance profiling (use performance_engineering), user flows
  (use user-flows), sitemap (use sitemap).
---

# Design Patterns & Architecture Skill — Design Before Code

## Purpose

The AI default is to write code immediately with no structure — every class
invented inline, no boundaries, no error strategy, no debuggability, no production
considerations. This skill forces a **design pass** first: what to create, how
things interact, how a request flows through the system, and how it will behave in
production.

**But the design pass must be sized to the product.** A two-page site does not need
six layers. A 10-line serverless function does not need five classes. Design the
SMALLEST structure that satisfies the requirements — then add a layer only when the
requirement actually demands it.

## When to Use

- Before implementing ANY feature that involves more than one file
- When user asks "what's the best way to structure this?"
- When user says "production ready" or "not just local development"
- When debugging is painful — that's a design smell, not just a bug

## The Design Pass — Follow This Order (Mandatory)

### 0. Classify the Scope FIRST (before designing)

Determine what this feature really is — and size the design to it:

| Scope | Design bar |
|-------|-----------|
| Single pure function/utility | No class, no pattern — one function with tests |
| One-page UI + one fetch | Component + hook + service function. No repository, no controller |
| Feature with list/detail + mutations | Controller + service + repository layer |
| Full backend domain (auth, billing, orgs) | Full layered design (below) |

Rules:
- **No layer exists without a requirement.** If nothing caches, there is no repository
  layer. If nothing manages state beyond `useState`, there is no controller.
- **Design the least that works**, then extend when a real second requirement appears.
- **Never invent requirements.** Don't add roles, permissions, multi-tenancy, or caching
  because "it might need it later." Ask the user instead.

### 1. Identify the Actors & Boundaries

Draw the boundaries first. Answer:

- What are the **layers**? (UI → Controller/State → Service → Repository → Data)
- What are the **modules/classes**? Name them now, with one-line responsibilities
- What are the **dependency directions**? (always one way)
- What are the **contracts/interfaces** between them? Define the interface BEFORE the implementation.

### 2. Define the Request/Response Flow

For the primary use cases, trace the full journey:

```
User Action → Component/Hook → Controller (state) → Service (API call)
    → HTTP → API Route/Controller → Service (business logic) → Repository → Database
    → Response → validation → error mapping → state update → UI re-render
```

- **Read flows** (queries): cache-first → revalidate → fallback
- **Write flows** (mutations): optimistic update → rollback on error → invalidation
- **Error propagation**: where errors are caught, logged, transformed, and surfaced
- Every edge: timeouts, retries, 401 re-auth, idempotency on retries

### 3. Choose Design Patterns (Do Not Invent New Ones)

Use proven patterns and say WHICH one you're applying:

| Pattern | Use When |
|---------|----------|
| **Layered Architecture** | Always — controller/service/repository separation |
| **Repository** | Abstracting data access so services don't know SQL/ORM |
| **Service Layer** | Business rules that don't belong in controllers or repos |
| **Dependency Injection** | Testing + decoupling (constructor injection, DI container) |
| **Factory** | Creating objects with complex or conditional setup |
| **Strategy** | Swappable algorithms (auth providers, payment gateways) |
| **Observer / Event Bus** | Decoupled side effects (emails, notifications, webhooks) |
| **Adapter** | Wrapping external APIs so they can be swapped/mocked |
| **DTO / Mapper** | Keeping API contracts separate from domain models |
| **Singleton** | One shared instance (config, DB client, logger) — with care |
| **State Machine** | Explicit lifecycle states (orders, payments, auth sessions) |

Rules: **prefer composition over inheritance**, **depend on abstractions**, **keep
modules small and single-purpose**. If you cannot name the pattern, the design is not
ready to code.

**Minimum-code mandate (the most important rule):** write the FEWEST lines that
implement the requirement correctly.

- A 10-line function that works beats a 100-line class hierarchy that "scales."
- One dependency you actually use beats five you might use someday.
- If two classes share only a method, a function is enough — do not create a base
  class, an interface, a factory, and a DTO for it.
- Extract a class/layer ONLY on the second concrete duplication or a genuine new
  requirement — never preemptively.
- Every file under ~50 lines that stays simple is fine. Simple beats clever.

Before writing each file, ask: **"What is the minimum code that does this correctly?"**
If the answer is 10 lines, write 10 lines.

### 4. Design for Debuggability (BEFORE Code)

Production code is debugged at 3am. Design for it now:

- **Structured logging** with correlation IDs passed through the request (tracing)
- **Centralized error types** — one Error hierarchy (e.g., `AppError`, `NotFoundError`, `ValidationError`) with `code`, `message`, `details`, `cause`
- **No swallowed errors** — every catch either handles, rethrows, or logs with context
- **Pure functions where possible** — testable, no hidden state
- **Feature flags / config** — toggle behavior without redeploys
- **Observability hooks** — metrics, traces, logs from day one, not after launch

### 5. Design for Production Readiness

Not "works on my machine". Ask and answer:

- **Performance**: what's cached, what's paginated, what's streamed? Bundle size, query count, cold starts.
- **Concurrency**: what happens with 10 users at once? Race conditions, locks, idempotency.
- **Reliability**: retries, backoff, circuit breakers for external calls, graceful degradation.
- **Security**: input validation at every boundary, authz checks in service layer not just UI (see ssdlc skill).
- **Deployment**: config from env, migrations, health checks, graceful shutdown.
- **Observability**: logs, metrics, traces, alerting thresholds.
- **Testing strategy**: what is unit-tested (services, pure logic), what is integration-tested (repos, API), what is E2E (critical flows).

### 6. Produce the Design Contract (Deliverable)

Before writing code, the AI MUST output:

1. **Module/class map** — name, responsibility, dependencies (interfaces, not impls)
2. **Request/response flow diagram** (ASCII or mermaid sequence)
3. **Pattern choices** — named patterns and where applied
4. **Error & logging strategy**
5. **Production checklist** — performance, reliability, security, observability, testing
6. **Ask for approval** — do not code until the user approves the design contract

---

## Per-Stack Recipe Cards

The universal principles above apply everywhere. The concrete class/pattern recipes
live in `references/`:

| Stack | Card |
|-------|------|
| TypeScript / Node backend (Express, Fastify, NestJS) | `references/stack-node-typescript.md` |
| React / Next.js frontend | `references/stack-react-next.md` |
| Python backend (FastAPI, Django) | `references/stack-python.md` |
| Mobile (React Native, Flutter) | `references/stack-mobile.md` |
| Monorepo | `references/stack-monorepo.md` |

Read the relevant card and apply it — do not improvise a structure per-feature.

## Files in This Skill

```
design-patterns/
├── SKILL.md                          ← this file (entry point)
└── references/
    ├── stack-node-typescript.md      ← Node/TS backend patterns
    ├── stack-react-next.md           ← React/Next frontend patterns
    ├── stack-python.md               ← Python backend patterns
    ├── stack-mobile.md               ← Mobile patterns
    └── stack-monorepo.md             ← Monorepo patterns
```

## Handoff

- Folder layout for the modules → load `folder-structure` skill
- Security of the design → load `ssdlc` skill
- User journeys driving the flows → load `user-flows` skill
- After coding: every module needs tests, logs, error handling — no exceptions

## Anti-Patterns to NEVER Produce

- God classes / god components (single file >300 lines without decomposition)
- Business logic in the UI layer or in controllers
- Swallowed errors (`catch {}` or `catch (e) { console.log(e) }`)
- Direct DB access from controllers
- Circular dependencies
- Unnamed, improvised "patterns" — if you can't name it, don't build it

## Over-Engineering Traps (NEVER fall into these)

These are the #1 reason AI code is rejected by senior engineers:

1. **Premature abstraction** — interfaces/base classes/factories for one implementation.
2. **Layers for layers' sake** — a repository + controller + service around a single
   `SELECT * FROM users`. If the service is one line, it doesn't need three classes.
3. **Invented requirements** — adding auth, roles, caching, or multi-tenancy the user
   never asked for.
4. **Over-configuration** — 40-line config for a feature whose code is 10 lines.
5. **"Scale-ready" bloat** — queues, metrics, and event buses on day one of a hobby
   project. Add them when there is real demand, not because they exist.
6. **Config-vs-code abuse** — a feature flag for every checkbox; constants in DB tables
   that should be literals.

Memory trick: **YAGNI + KISS.** You Aren't Gonna Need It. Keep It Simple. If you're
unsure, write the direct version (10 lines) and let the user ask for more.
