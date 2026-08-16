# SHODASHA Browser — Development

## Requirements

- **Node.js 20+**
- **npm 9+**

## Setup

```bash
npm install
```

## Scripts

Run from the repository root:

| Command                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `npm run build`        | Build `@shodasha/core` and `@shodasha/desktop` |
| `npm run typecheck`    | Type-check all workspaces                      |
| `npm run lint`         | Run ESLint across workspaces                   |
| `npm run format`       | Format all files with Prettier                 |
| `npm run format:check` | Verify formatting                              |
| `npm test`             | Run all unit tests                             |
| `npm run dev`          | Build and launch the desktop shell (Electron)  |

## Environment configuration

- Copy `.env.example` to `.env` for local values. Never commit `.env`.
- Secrets are read only from the process environment (see
  `packages/core/src/security/secrets.ts`).
- There are no hardcoded API keys.

## Workspace commands

You can also run commands inside a workspace:

```bash
npm run build --workspace=@shodasha/core
npm run test --workspace=@shodasha/core
npm run dev --workspace=@shodasha/desktop
```

## Adding a new module to the core

1. Create files under `packages/core/src/<area>/`.
2. Export the public surface from `packages/core/src/index.ts`.
3. Add unit tests alongside (`*.test.ts`).
4. Run `npm test` and `npm run typecheck`.

## Conventions

- Strict TypeScript everywhere; do not loosen compiler flags.
- No `eval`, no arbitrary remote code execution.
- No secrets in source; environment-only secrets.
- Never log passwords, cookies, auth tokens, or sensitive form data.
- No unnecessary dependencies.

## Roadmap (in order)

- [x] Content filtering engine (implement + wire into desktop request pipeline)
- [x] SHODASHA Shield: rule-based request filtering (block/allow rules,
      categories, modes, per-site control, allowlist, statistics)
- [ ] Tab management
- [ ] Password manager (with encrypted at-rest storage)
- [ ] Settings & privacy controls UI
- [ ] Android host (`apps/android`)
- [ ] Play Store packaging

## Working on the Shield

- Core engine tests: `npm test --workspace=@shodasha/core` (the Shield has its
  own unit tests plus a real-browser smoke test).
- The desktop resolves `@shodasha/core` from its built `dist`; after core
  changes, rebuild the core before type-checking or launching the desktop:
  `npm run build --workspace=@shodasha/core`.
- Rule model, decision model, and engine entry points live under
  `packages/core/src/shield/`. Keep the decision pipeline deterministic and
  fail-open; keep events and stats hostname-only.
- When bundling filter lists, always record `license`, `updatedAt`, and
  `provenance` — nothing may be bundled silently (see PRIVACY.md).

The foundation is intentionally feature-free; each feature is added as a
focused milestone and verified independently.
