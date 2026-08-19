# Monorepo Structure Reference

Deep-dive of the canonical monorepo structure. Use only when multiple apps share
code — otherwise prefer the simpler fullstack layout.

## Canonical Tree

```
.
├── apps/
│   ├── web/                      # frontend (frontend tree — see frontend.md)
│   └── api/                      # backend (backend tree — see backend.md)
├── packages/
│   ├── config/                   # shared tsconfig, eslint presets, build configs
│   ├── types/                    # shared domain types (User, Product)
│   ├── contracts/                # API contracts / DTOs consumed by apps
│   └── utils/                    # shared pure helpers
├── infra/                        # deployment, docker-compose, CI configs (optional)
├── docs/                         # architecture docs, ADRs
├── package.json                  # workspace root
├── pnpm-workspace.yaml
└── turbo.json                    # task pipelines (optional)
```

## How to Decide Where a File Goes

| Concern | Home |
|---------|------|
| Deployable app (web, api, mobile) | `apps/<app>/` |
| Shared by 2+ apps (configs, types, contracts, utils) | `packages/<pkg>/` |
| Deployment/infra | `infra/` |
| Architecture decisions | `docs/` |

## Rules

1. **Apps never import each other** — `apps/web` and `apps/api` communicate via `packages/contracts` and HTTP.
2. **Packages never import apps.**
3. **Contracts are the single source of truth** for API shapes — both sides import them.
4. **Keep packages focused** — one package per concern (config, types, contracts, utils).
5. **Workspace manager: pnpm** (+ Turborepo for build caching when the graph grows).
6. **Lockfile committed; install with `--frozen-lockfile` in CI.**
7. **Promote to a package only on second use** — don't create packages preemptively.

## Request Flow Across the Workspace

```
web (page) → web service → typed client (built from contracts)
   → HTTP → api route → api controller → service → repository → DB
   → response typed by the same contracts → UI
```

## When NOT to Use

- Single app with no shared-code need → use `frontend` or `backend` tree.
- Two apps but little shared code → use `fullstack` tree (client/ + server/ + shared/).
- Solo project / early stage → start simple; monorepos add real tooling cost.
