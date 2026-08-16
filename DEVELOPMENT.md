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
- [x] SHODASHA Privacy Center (`shodasha://privacy`): protection status,
      session/site statistics, controls, filter-list status, allowlist
      manager, recent activity; settings persist, statistics are session-only
- [x] SHODASHA Bookmark Manager (`shodasha://bookmarks`): persistent local
      bookmarks + folders, star button, add/edit/delete/move/search, optional
      toolbar (Ctrl+Shift+B)
- [ ] Tab management
- [ ] Password manager (with encrypted at-rest storage)
- [ ] Filter-list manager UI with updates
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
- The Privacy Center reuses the Shield engine as its single source of truth
  (`ShieldCoordinator.serializePrivacyState()`). Never add a second state
  manager or fabricated statistics; only real engine counters may be shown.
- Shield settings persist through `apps/desktop/src/main/settingsStore.ts`
  (serde lives in `packages/core/src/shield/persistence/shieldSettings.ts`).
  Never persist statistics or events — they are session-only by design.

## Working on Bookmarks

- Core model/manager tests: `npm test --workspace=@shodasha/core` (the
  bookmarks module has its own unit tests plus a real-browser smoke test).
- The desktop resolves `@shodasha/core` from its built `dist`; after core
  changes, rebuild the core before type-checking or launching the desktop:
  `npm run build --workspace=@shodasha/core`.
- The single source of truth is the core `BookmarkManager` held by
  `apps/desktop/src/main/bookmarkCoordinator.ts`. Keep one source of truth;
  never add a second bookmark store.
- The renderer runs as a raw browser ES module (no bundler) and cannot import
  `@shodasha/core` at runtime. Renderer-reachable pure helpers (search/sort)
  live in `apps/desktop/src/shared/browserState.ts`; keep runtime imports out
  of the renderer.
- All bookmark IPC is validated in the main process (`parseAddInput`,
  `parseUpdateInput`). URLs are restricted to `http:`/`https:` and SHODASHA
  internal pages; dangerous schemes must always be rejected before storage.
- Bookmarks persist through `apps/desktop/src/main/bookmarkStore.ts`
  (serde lives in `packages/core/src/bookmarks/bookmarkPersistence.ts`).
  Bookmark data never leaves the device.

The foundation is intentionally feature-free; each feature is added as a
focused milestone and verified independently.
