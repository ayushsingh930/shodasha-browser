# Monorepo Pattern Card

Apply this card for any multi-app / shared-code repository. Universal core in
`SKILL.md` applies. Use a monorepo ONLY when the complexity is justified (multiple
apps, shared packages, synchronized changes) — otherwise prefer a simple fullstack
layout.

## When to Go Monorepo

- Multiple deployable apps sharing code (web + api + mobile) ✓
- Team wants PR-level atomic changes across apps ✓
- Otherwise → use `fullstack` layout (client/server/shared) instead
- Warning: package management + CI complexity is real; don't add it for one app

## Canonical Layout

```
apps/
├── web/                          # frontend (see stack-react-next.md)
└── api/                          # backend (see stack-node-typescript.md or python)
packages/
├── config/                       # shared tsconfig/base, eslint-preset
├── types/                        # shared domain types
├── contracts/                    # API contracts / DTOs consumed by apps
└── utils/                        # pure shared helpers
pnpm-workspace.yaml
```

## Package Boundaries

- `packages/contracts` is the **single source of truth** for API shapes — web and api both import the same request/response types. No bit-rot DTOs.
- `packages/types` for domain entities (User, Product) shared across apps.
- `apps/api` NEVER imports `apps/web` and vice versa. Both import `packages/*`.
- `packages/*` NEVER import `apps/*`. Depend on abstractions, not each other (unless explicit).

## Build / Dev

- Workspace manager: **pnpm workspaces** (or turborepo on top for caching/pipelines)
- Shared `tsconfig.base.json` extended by every app
- One `vitest` config reusable across packages with `vitest.workspace`.
- CI: run typecheck/lint/test across workspace; build apps with dependency graph (turbo).

## Request Flow Across the Workspace

```
web (Next route handler) → imports contract type from @repo/contracts
   → calls api via typed client built from contracts
api → validates with contract schema → service → repository → DB
```

## Production Checklist

- [ ] Contracts versioned; breaking changes need explicit major bump
- [ ] Build pipeline requires dependency install with `--frozen-lockfile`
- [ ] Only `apps/*` get deploy configs; packages are build-time deps
- [ ] Shared code isn't a junk drawer — promote with a purpose, prune unused
- [ ] Lockfile in version control; no accidental private registry drift
- [ ] Worker/queue handling defined once, reused by apps that need it