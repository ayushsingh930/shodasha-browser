# Frontend Structure Reference (Next.js / React)

Deep-dive of the canonical frontend structure. The feature-first + layered pattern.
Every feature is a self-contained module with a public API.

## Canonical Tree

```
src/
├── app/                          # Next.js App Router — routes, layouts, providers
│   ├── layout.tsx                # root layout (fonts, metadata, providers)
│   ├── page.tsx                  # home page (thin composition layer)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       └── page.tsx
├── config/                       # runtime config, env vars, constants
│   └── index.ts
├── features/                     # feature modules (self-contained, domain-driven)
│   └── auth/
│       ├── model/                # types, interfaces, schemas (User, Session)
│       ├── config/               # feature constants (e.g., token keys, ttl)
│       ├── service/              # network calls: authService.login(...)
│       ├── controller/           # state orchestration: useAuthController()
│       ├── repository/           # data access: query cache, mutations, storage
│       ├── components/           # LoginForm, AuthGuard
│       ├── hooks/                # useSession, useLogin
│       └── index.ts              # PUBLIC API — only exports from here
├── entities/                     # domain models shared across features
│   └── user/
│       ├── model/                # types, schemas, invariants
│       └── index.ts
├── shared/                       # business-agnostic reusable code
│   ├── ui/                       # design system primitives (Button, Input)
│   ├── hooks/                    # generic hooks (useDebounce, useMediaQuery)
│   ├── lib/                      # pure utilities (cn, formatDate, validators)
│   ├── api/                      # HTTP client, interceptors, typed endpoints
│   └── types/                    # shared types
├── lib/                          # low-level infra (api-client, query-client, logger)
├── styles/                       # globals.css, tokens.css
└── types/                        # project-wide ambient types
```

## How to Decide Where a File Goes

| File | Home |
|------|------|
| UI component used by one feature | `features/<f>/components/` |
| UI component used by 2+ features | promote to `shared/ui/` (on second use) |
| Domain type (User, Product) | `entities/<entity>/model/` |
| Feature-local type | `features/<f>/model/` |
| API call for one feature | `features/<f>/service/` |
| API client / interceptors | `shared/api/` or `lib/api-client.ts` |
| Server-state caching (TanStack Query) | `features/<f>/repository/` |
| State orchestration for a page | `features/<f>/controller/` |
| Pure helper | `shared/lib/` (promote on 2nd use) |
| Env vars / constants | `config/` or `features/<f>/config/` |

## Rules

1. **Dependency direction**: `app → features → entities → shared`. Never backward.
2. **No cross-feature imports** — promote shared code to `entities/` or `shared/`.
3. **Public API via `index.ts`** — external code imports only from `features/auth`, never deep paths.
4. **Thin pages** — `app/` composes, does not contain business logic.
5. **Co-locate by domain** — styles, tests, types next to the code they belong to.
6. **Layered per feature** — model → config → service → repository → controller → components/hooks.
7. **Promote to `shared/` only on second use** — avoid premature abstraction.

## When the Feature Grows Too Big

Split by sub-domain:

```
features/checkout/
├── model/  config/  service/  repository/  controller/  components/  hooks/  index.ts
└── subfeatures/          ← only when the feature becomes a module of its own
```

If a feature exceeds ~10 files, consider extracting sub-features or promoting shared pieces.
