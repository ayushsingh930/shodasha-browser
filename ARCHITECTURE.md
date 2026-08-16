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
- **`core/src/shield`** — the SHODASHA Shield: a pure, host-agnostic request
  filtering engine. Owns the request model, hostname/domain matching, the
  rule model (block/allow, categories, resource-type and party scoping,
  enabled state), first/third-party classification, per-site settings, the
  allowlist, protection modes (standard/strict/custom), a bounded decision
  cache, aggregate + per-site session statistics, and a privacy-safe recent
  events buffer. It performs no I/O and never fabricates or stores
  per-request history.
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
  state to the renderer while subscribed (ref-counted across the popup and the
  Privacy Center). Loads the bundled demo test list at startup, serializes the
  Privacy Center state, and persists settings through the settings store.
- **`apps/desktop/src/main/settingsStore`** — debounced, atomic, fail-safe
  JSON persistence for Shield settings (settings only; never statistics).
- **`apps/desktop/src/preload`** — isolated preload bridge.
- **`apps/desktop/src/renderer`** — sandboxed UI (toolbar, tabs, NTP, Shield
  popup, site-settings panel, and the chrome-rendered Privacy Center).

## SHODASHA Shield — request filtering

The Shield filters at the **browser/network layer**: on desktop, Electron's
`webRequest.onBeforeRequest` observes every request on the shared session,
builds a typed `ShieldRequest` (normalized hostname, origin, resource type,
method, first-party origin, tab context), and asks the engine for a decision.
Decisions are applied by the host as a real cancellation of the request —
never by rewriting page content.

### Decision pipeline

The engine's flow is deterministic (see `shieldEngine.ts`):

```
Request
  ├─ unclassifiable             → UNKNOWN (never blocked)
  ├─ shield off (global/site)   → ALLOW
  ├─ allowlist match            → ALLOWLISTED (outranks all rules)
  ├─ allow rule match           → ALLOW (explicit allow wins over blocks)
  ├─ block rule match           → BLOCK
  └─ otherwise                  → ALLOW
```

Priority is fixed and documented: global state → per-site state → allowlist →
allow rules → block rules → default allow. The engine is **fail-open**: an
unclassifiable request, an unknown party context, an evaluation error, or a
malformed rule all result in ALLOW — never a block and never a crash.

### Request normalization and matching

- Hostnames are lowercased, trimmed, and have a single trailing DNS dot
  stripped (`normalizeHostname`). Ports, userinfo, query strings, fragments,
  and schemes never participate in matching.
- `hostname` rules match exactly; `domain` rules match the domain and every
  parent domain via `parentDomains` (lookup-based, no regex). Suffix
  impostors (`evil-example.com`, `example.com.evil.com`) can never match
  `example.com`.
- IPv4 literals, `localhost`, and uppercase hostnames are supported. IPv6
  literals are never used as rule values; such requests fail open.
- First/third-party classification uses the registrable-domain relationship
  (`sameSite`); when the first-party origin is unknown the party is
  `unknown-party` and party-scoped rules simply do not apply (never guessed).

### Rule model

A `FilterRule` carries: `id`, `kind` (`domain` | `hostname`), `category`
(`ads`, `trackers`, `social-tracking`, `malicious-domains`, `other`),
`value` (normalized hostname), `source`, `action` (`block` | `allow`), and
optional `resourceTypes` and `party` scoping plus an `enabled` state.
Malformed rules (invalid hostname, resource type, or party) are rejected at
load time and reported via the accepted count.

### Filter lists

Lists are provided through the `FilterListSource` interface, which requires
`id`, `name`, `version`, `license`, `updatedAt`, and `provenance` metadata —
nothing is bundled silently. The repository ships only a small deterministic
**demo test list** (`lists/demoFilterList.ts`) using reserved `.test` domains
(`ads.test`, `tracker.test`, `analytics.test`, `social.test`) to prove the
request → rule match → BLOCK → statistic pipeline end to end. These are test
domains, not real ad/tracking networks. Real lists must be imported with a
license that permits the intended use (see PRIVACY.md).

### Modes, per-site control, allowlist

- **STANDARD** — the four core categories. **STRICT** — adds `other`. Both
  remain rule-based: strict mode never blindly blocks all third-party
  requests. **CUSTOM** — user-chosen categories.
- Per-site settings (Shield ON/OFF, per-site mode) are explicit, stored per
  hostname, and override the global state for that site only.
- The allowlist matches the request hostname and its parent domains, strictly
  scoped (an allowlisted `trusted-site.com` covers `www.trusted-site.com` but
  never `trusted-site.com.evil.com`).

### Performance

Matching is Map/Set-based (no per-request regex or filesystem access).
Decisions are cached in a bounded cache (4 096 entries) keyed by hostname,
party, resource type, current site, and a context version; the cache is
invalidated on every rule, mode, allowlist, or per-site change, so stale or
bypassable decisions are impossible. Panel pushes to the renderer are
throttled (500 ms) and only occur while a UI (the popup or the Privacy
Center) is subscribed; subscribers are ref-counted.

### Statistics and events

Aggregate counters (`requestsEvaluated`, `requestsBlocked`, `requestsAllowed`,
`trackersBlocked`, `adsFiltered`) are session-scoped and count each request
once. Per-site aggregate counters for the current site (including its own
tracker/ad breakdown) are kept in memory only (bounded). Recent filter events
are mirrored into a small in-memory buffer (50 entries) holding only
`category`, `resource type`, `hostname`, and `action` — never full URLs, query
strings, or payloads, and nothing is persisted.

## SHODASHA Privacy Center

The Privacy Center is a chrome-rendered internal page at `shodasha://privacy`
(no custom scheme registration — it is a model-level URL). It shares the
**single source of truth**: the `ShieldCoordinator` serializes the engine's
real state (`serializePrivacyState()`) — panel state, allowlist, filter-list
status, total rules loaded, and an honest `protectionStatusFor()` derivation
(PROTECTED / LIMITED / OFF). The renderer re-fetches this state on each
throttled panel push while the page is visible, so the dashboard always shows
real counters and never fabricated numbers.

### Persistence boundary

Settings survive restarts via `ShieldSettingsStore`
(`apps/desktop/src/main/settingsStore.ts`): a JSON file in Electron's
user-data directory, loaded fail-safely and saved debounced (300 ms) with an
atomic tmp+rename write, flushed on `before-quit`. The host-agnostic
serialization lives in the core as pure functions
(`packages/core/src/shield/persistence/shieldSettings.ts`). Only settings are
persisted — statistics, events, and browsing activity are session-only and
never touch disk. Loaded filter lists report their status through the core
engine's `listStatus()` (name, rules, version, license, updatedAt, provenance,
`updatesEnabled: false`).

## Content filtering seam

The Shield engine (`core/src/shield`) is the host-agnostic engine: it takes a
structured `ShieldRequest` and returns a deterministic decision
(`allow` / `allow-rule` / `block` / `allowlisted` / `unknown`) using only
active-category rules and the user's allowlist. Blocking is always rule-based;
the Shield never treats third-party requests as blockable by themselves. On
desktop the `ShieldCoordinator` maps each Electron request into this model and
cancels requests whose decision is `block`. Because the contract is
host-agnostic, the Android host can reuse the same engine behind a WebView.
List loading and high-performance matching plug in through the
`FilterListSource` and `RuleEngine` interfaces without touching the decision
model.

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
