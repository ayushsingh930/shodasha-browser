# SHODASHA Browser

> **Private. Fast. Yours.**

SHODASHA is a privacy-first web browser under development. It aims to deliver
user-controlled content filtering, strong security, modern browser features,
and — eventually — an Android release suitable for Google Play distribution.

This repository currently contains the **foundation build**: a clean, modular,
strictly-typed TypeScript project that establishes the architecture before any
browser features are implemented.

## Status

- ✅ Project foundation (workspace, core library, desktop shell, tooling, tests)
- ⏳ Content filtering engine (interface defined, implementation pending)
- ⏳ Tab management
- ⏳ Password manager
- ⏳ Android / Play Store packaging

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
│   ├── src/security/       Secret handling & redaction
│   ├── src/storage/        Storage abstraction interfaces
│   └── src/logging/        Privacy-safe structured logger
└── apps/desktop/           Electron desktop shell (secure-by-default)
```

## License

Private / UNLICENSED. SHODASHA is an independent implementation with its own
visual identity; it does not copy Brave or any other proprietary browser code,
branding, or assets.
