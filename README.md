# SHODASHA Browser

> **Private. Fast. Yours.**

SHODASHA is a privacy-first web browser under development. It aims to deliver
user-controlled content filtering, strong security, modern browser features,
and — eventually — an Android release suitable for Google Play distribution.

This repository contains the **foundation build**: a clean, modular,
strictly-typed TypeScript project that establishes the architecture, plus a
working request filter (SHODASHA Shield) wired into the desktop browser.

## Status

- ✅ Project foundation (workspace, core library, desktop shell, tooling, tests)
- ✅ SHODASHA Shield — rule-based ad/tracker request filtering (modes,
      per-site control, allowlist, statistics, recent activity)
- ✅ SHODASHA Privacy Center — `shodasha://privacy` dashboard: protection
      status, session/site statistics, protection controls, filter-list
      status, allowlist manager, recent activity; settings persist across
      restarts (statistics are session-only)
- ✅ SHODASHA Bookmark Manager — persistent bookmarks and folders, star
      button, add/edit/delete/move/search, an optional bookmarks toolbar
      (Ctrl+Shift+B), and a chrome-rendered `shodasha://bookmarks` manager;
      stored locally on this device
- ⏳ Tab management
- ⏳ Password manager
- ⏳ Android / Play Store packaging

The Shield filters requests at the network layer via deterministic rules and
never claims to block every ad or tracker — it only blocks what a validated
rule matches. The bundled demo list covers reserved `.test` domains to prove
the pipeline; real lists must be imported with their license metadata. The
Privacy Center reports honest protection status (PROTECTED / LIMITED / OFF)
and real engine counters; it never fabricates statistics or claims absolute
privacy. See [PRIVACY.md](./PRIVACY.md) for the full behavior.

See [DEVELOPMENT.md](./DEVELOPMENT.md) for the roadmap and
[ARCHITECTURE.md](./ARCHITECTURE.md) for the design.

## Quick start

Requirements: **Node.js 20+** and **npm**.

```bash
npm install
npm run build        # builds @shodasha/core and @shodasha/desktop
npm test             # runs unit tests
npm run lint         # runs ESLint across workspaces
npm run dev          # builds and launches the desktop shell (Electron)
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design and rationale
- [SECURITY.md](./SECURITY.md) — security philosophy and policy
- [PRIVACY.md](./PRIVACY.md) — privacy philosophy and policy
- [DEVELOPMENT.md](./DEVELOPMENT.md) — setup, scripts, and roadmap

## Repository layout

```
├── packages/core/          Platform-agnostic browser logic (pure TypeScript)
│   ├── src/url/            URL privacy utilities
│   ├── src/privacy/        Content-filtering contracts & engine
│   ├── src/shield/         SHODASHA Shield: rule engine, allowlist, modes,
│   │                       stats & events (host-agnostic)
│   ├── src/bookmarks/      Bookmark model, manager & persistence (host-agnostic)
│   ├── src/security/       Secret handling & redaction
│   ├── src/storage/        Storage abstraction interfaces
│   └── src/logging/        Privacy-safe structured logger
└── apps/desktop/           Electron desktop shell (secure-by-default)
```

## License

Private / UNLICENSED. SHODASHA is an independent implementation with its own
visual identity; it does not copy Brave or any other proprietary browser code,
branding, or assets.
