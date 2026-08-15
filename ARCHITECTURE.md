# SHODASHA Browser — Architecture

## Overview

SHODASHA uses a **modular monorepo** with a clean separation between
**platform-agnostic browser logic** and **host shells**. The core is a pure
TypeScript library with no UI and no host-specific APIs; hosts consume it and
wire the contracts into their platform.

```
┌──────────────────────────────────────────────────────────────┐
│                           HOSTS                              │
│   apps/desktop (Electron)   future: apps/android (WebView)   │
└───────────────────────────────┬──────────────────────────────┘
                                │  imports @shodasha/core
┌───────────────────────────────▼──────────────────────────────┐
│                      packages/core                           │
│  url/    privacy/    security/    storage/    logging/        │
│  (pure TypeScript, platform-agnostic, strict)                │
└──────────────────────────────────────────────────────────────┘
```

## Why this architecture was selected

1. **Portability to Android.** By keeping all browser logic in a pure library
   (`@shodasha/core`) with no dependency on Electron, the same logic can be
   reused in a future Android host (e.g. a WebView or a Kotlin/Compose shell).
   This avoids a rewrite and keeps a single source of truth.
2. **Strict typing.** TypeScript in strict mode (with `noUncheckedIndexedAccess`
   and friends) catches whole classes of bugs at compile time — critical for
   security-sensitive code.
3. **Separation of concerns.** UI, browser logic, privacy logic, security
   logic, storage, and utilities are cleanly separated into modules, each with
   a narrow responsibility and a public API surface (`src/index.ts`).
4. **Secure-by-default.** The host establishes hardened defaults (context
   isolation, sandbox, no node integration) and the core provides contracts
   (encrypted storage, redacting logger) that make insecure patterns hard.

## Technology choices

| Concern       | Choice                     | Rationale                                |
| ------------- | -------------------------- | ---------------------------------------- |
| Language      | TypeScript (strict)        | Type safety for security-sensitive code  |
| Workspaces    | npm workspaces             | Monorepo without extra tooling           |
| Desktop shell | Electron                   | Chromium + secure `session`/request APIs |
| Tests         | Vitest                     | Fast, TS-native, zero config             |
| Linting       | ESLint (typescript-eslint) | Strict typed ruleset                     |
| Formatting    | Prettier                   | Consistent style                         |
| Secrets       | Environment only           | No committed credentials                 |

## Module responsibilities

- **`core/src/url`** — URL parsing and privacy cleaning (tracking-parameter and
  fragment stripping).
- **`core/src/privacy`** — content-filtering contracts and the reference
  engine. The engine contract is the seam where a future high-performance
  filter will plug in.
- **`core/src/shield`** — the SHODASHA Shield foundation: pure, host-agnostic
  request model, rule engine (domain/hostname), allowlist, filter-category and
  protection-mode models, blocklist parsing, and aggregate session statistics.
  It performs no I/O and never fabricates or stores per-request history.
- **`core/src/security`** — secret loading, bounded secret reads, and
  redaction helpers.
- **`core/src/storage`** — interfaces (`KeyValueStore`, `EncryptedStore`) that
  hosts implement; the core never depends on a concrete store.
- **`core/src/logging`** — structured logger that refuses sensitive topics.
- **`apps/desktop/src/main`** — Electron main process: lifecycle and hardened
  window creation.
- **`apps/desktop/src/main/shieldCoordinator`** — wires the core Shield into
  Electron's request pipeline (`webRequest.onBeforeRequest`): builds a
  `ShieldRequest` per filterable request, evaluates it against the active
  site's settings, cancels only blocked requests, and pushes throttled panel
  state to the renderer while subscribed.
- **`apps/desktop/src/preload`** — isolated preload bridge.
- **`apps/desktop/src/renderer`** — sandboxed UI.

## Content filtering seam

The Shield foundation (`core/src/shield`) is the host-agnostic engine: it takes
a structured `ShieldRequest` and returns a deterministic decision
(`allow` / `block` / `allowlisted` / `unknown`) using only active-category
rules and the user's allowlist. Blocking is always rule-based; the Shield never
treats third-party requests as blockable by themselves. On desktop the
`ShieldCoordinator` maps each Electron request into this model and cancels
requests whose decision is `block`. Because the contract is host-agnostic, the
Android host can reuse the same engine behind a WebView. List loading and
high-performance matching plug in through the `FilterListSource` and
`RuleEngine` interfaces without touching the decision model.

## Path to Android / Google Play

1. **Keep the core pure.** It already has no host dependencies.
2. **Add an Android host** (`apps/android`) that embeds the same `@shodasha/core`
   logic behind a WebView, providing a `ContentFilterEngine` and an
   `EncryptedStore` backed by the Android Keystore.
3. **Meet Play policy.** Transparent user-controlled filtering, no DRM/paywall
   bypass, standard permissions, and a privacy policy — all aligned with the
   project's stated boundaries.
4. **Packaging.** Use a cross-platform build pipeline (e.g. Capacitor or a
   native bridge) once the desktop feature set stabilizes.
