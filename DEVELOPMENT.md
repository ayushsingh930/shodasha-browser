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

- [ ] Content filtering engine (implement + wire into desktop request pipeline)
- [ ] Tab management
- [ ] Password manager (with encrypted at-rest storage)
- [ ] Settings & privacy controls UI
- [ ] Android host (`apps/android`)
- [ ] Play Store packaging

The foundation is intentionally feature-free; each feature is added as a
focused milestone and verified independently.
