# Backend Structure Reference (Controller-Service-Repository)

Deep-dive of the canonical backend structure. Applies to Express, Fastify, NestJS,
and similar Node/TS backends. For Python (FastAPI/Django), see the mapping notes.

## Canonical Tree

```
src/
├── controllers/                  # HTTP layer — parse request, format response
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   └── billing.controller.ts
├── services/                     # business logic layer — rules, orchestration
│   ├── auth.service.ts
│   ├── user.service.ts
│   └── billing.service.ts
├── repositories/                 # data access layer — DB queries, external APIs
│   ├── user.repository.ts
│   ├── billing.repository.ts
│   └── subscription.repository.ts
├── models/                       # entities, ORM models, schemas
│   ├── user.model.ts
│   └── subscription.model.ts
├── middleware/                   # cross-cutting HTTP concerns
│   ├── auth.middleware.ts
│   ├── rate-limit.middleware.ts
│   ├── error-handler.middleware.ts
│   └── logging.middleware.ts
├── validators/                   # request validation schemas
│   ├── auth.validator.ts
│   └── billing.validator.ts
├── routes/                       # route definitions → controller mapping
│   ├── index.ts
│   ├── auth.routes.ts
│   └── user.routes.ts
├── config/                       # env vars, DB connection, third-party setup
│   └── index.ts
├── utils/                        # pure helpers
├── types/                        # shared types
├── app.ts                        # app assembly (middleware + routes)
└── index.ts / server.ts          # entry point (boot + graceful shutdown)
```

## How to Decide Where a File Goes

| Concern | Home |
|---------|------|
| HTTP parsing, status codes, response shape | `controllers/` |
| Business rules, orchestration, transactions | `services/` |
| SQL/ORM queries, external API calls | `repositories/` |
| DB entities / ORM schemas | `models/` |
| Auth, rate-limit, logging, error mapping | `middleware/` |
| Request validation (zod/joi/class-validator) | `validators/` |
| URL → controller binding | `routes/` |
| Env, DB connection, client setup | `config/` |

## Request Flow

```
request → middleware (auth, logging, request-id)
        → route → controller (parse + validate) → service (business rules)
        → repository (query) → DB / external API
        ← response ← error mapped by error-handler middleware
```

## Python (FastAPI/Django) Mapping

| This tree | FastAPI | Django |
|-----------|---------|--------|
| controllers | routers + deps | views |
| services | services | services/use-cases |
| repositories | repositories | repositories/managers |
| models | SQLAlchemy models | Django models |
| validators | Pydantic schemas | DRF serializers |
| routes | app.include_router | urls.py |

## Rules

1. **Dependency direction**: `routes → controllers → services → repositories → models`. Never backward.
2. **Controllers are thin** — parse, validate, call one service method, format response. No business logic.
3. **Services are the only place with business rules** — and they never touch `req`/`res`.
4. **Repositories are the only place that knows SQL/ORM/external calls**.
5. **One error-handler middleware** owns all error → HTTP status mapping.
6. **Validation at the boundary** — never trust the controller input.
7. **Never expose internal errors** (stack traces, DB details) to clients.
