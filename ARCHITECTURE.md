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
│                       packages/core                           │
│  url/    privacy/    shield/    bookmarks/    history/    security/        │
│  storage/    logging/                                          │
│  (pure TypeScript, platform-agnostic, strict)                  │
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
- **`core/src/bookmarks`** — the SHODASHA bookmark model and manager: a flat
  collection of bookmarks plus folders, stable ids, URL validation (only
  `http:`/`https:` and SHODASHA internal pages are accepted), conservative
  duplicate detection, local search/sort, and fail-safe persistence
  serialization. Pure and host-agnostic: bookmarks are never executed as
  code, and the manager performs no I/O.
- **`core/src/history`** — the SHODASHA visit model and recorder: stable
  per-tab `historyEntryId`s, title/favicon/timestamp capture, conservative
  duplicate folding (same URL within a 5s window folds into the newest
  entry), a bounded 10k-entry retention window, title/URL search, per-entry
  deletion, per-site clearing, and fail-safe persistence serialization. Pure
  and host-agnostic: only `http:`/`https:` visits are recorded, internal
  pages are never recorded, and the recorder performs no I/O.
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
- **`apps/desktop/src/main/bookmarkStore`** — debounced, atomic, fail-safe
  JSON persistence for the bookmark collection (a single `bookmarks.json`
  file); a separate small `bookmarks-ui.json` holds the toolbar-visibility
  preference so the collection format stays pure. Bookmarks never leave the
  device.
- **`apps/desktop/src/main/bookmarkCoordinator`** — owns the single source of
  truth for bookmarks (the core `BookmarkManager`) plus its persistence, and
  exposes a narrow, validated IPC surface. Derives the star-button state from
  the active tab, captures a safe page favicon at add time, pushes bookmark
  state to the chrome UI (immediately for mutations, throttled with a trailing
  push for navigation changes), and notifies the layout of toolbar changes.
  Every renderer input is validated here in the main process.
- **`apps/desktop/src/main/historyStore`** — debounced, atomic, fail-safe JSON
  persistence for the visit log (a single `history.json` file); corrupt data
  degrades to an empty log.
- **`apps/desktop/src/main/historyCoordinator`** — owns the single source of
  truth for history (the core `HistoryRecorder`) plus its persistence, and
  exposes a narrow, validated IPC surface: state snapshots, search, per-entry
  deletion, time-range clearing, and per-site clearing. It serializes the
  privacy-safe list model (URL, title, favicon, visit count, latest visit) for
  the chrome UI and keeps a ref-counted subscription while the History Manager
  is visible. Every renderer input is validated here in the main process.
- **`apps/desktop/src/main/browserController`** — owns live tabs and
  navigation. Records genuine `http:`/`https:` page loads as visits
  (`did-navigate` / `did-navigate-in-page`), skipping internal pages, and
  guards load events with a per-tab navigation sequence so a stale event from
  an in-flight load can never overwrite a newer navigation (for example,
  opening an internal page while a web page is still loading).
- **`apps/desktop/src/preload`** — isolated preload bridge.
- **`apps/desktop/src/renderer`** — sandboxed UI (toolbar, tabs, NTP, Shield
  popup, site-settings panel, and the chrome-rendered Privacy Center, Bookmark
  Manager, and History Manager).

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

## SHODASHA Bookmark Manager

The Bookmark Manager is a chrome-rendered internal page at
`shodasha://bookmarks` (no custom scheme registration — it is a model-level
URL, like the Privacy Center). Bookmarks are owned by a **single source of
truth**: the core `BookmarkManager` held by the `BookmarkCoordinator` in the
main process.

### Data model

Bookmarks are a flat collection: a list of `Bookmark` records plus a list of
`BookmarkFolder` records (`packages/core/src/bookmarks/bookmarkModel.ts`).
Every bookmark has a stable, unique id (never the URL, because the same URL
can appear with different metadata), a title, the validated URL, timestamps,
an optional `folderId` (`null` = root/unfiled), and an optional favicon URL
captured safely from the page at add time.

### URL validation

Only `http:`, `https:`, and SHODASHA's own internal pages
(`shodasha://privacy`, `shodasha://bookmarks`) may be stored. Dangerous
schemes (`javascript:`, `data:`, `file:`, and any other) are rejected so a
bookmark can never become an execution vector. A conservative normalized key
(`bookmarkKeyForUrl`) is used only for duplicate detection; the stored URL is
never rewritten.

### Single source of truth and state flow

- The `BookmarkCoordinator` holds the core manager and the `BookmarkStore`
  that persists it locally. It derives the star-button state (active URL →
  bookmarked id) and pushes bookmark state to the chrome UI: immediately for
  mutations, throttled (400 ms) with a trailing push for tab-navigation
  changes. The renderer keeps a single subscription at boot, so the star, the
  toolbar, and the manager page all stay in sync.
- The star button opens the add dialog for the active page (or the edit
  dialog when the page is already bookmarked). The page context menu's
  "Bookmark this page" action sends trusted `{url, title}` from the main
  process to open a pre-filled dialog.
- The bookmarks toolbar shows unfiled bookmarks, sorted by name, scrolling
  horizontally when there are more than fit. It is toggled with Ctrl+Shift+B
  and its visibility preference is persisted.
- Every renderer input is validated in the main process (`parseAddInput`,
  `parseUpdateInput`); the renderer is never trusted. Favicons are captured on
  the main side from the active tab and only ever used as `<img>` sources.

### Persistence boundary

Bookmarks survive restarts via `BookmarkStore`
(`apps/desktop/src/main/bookmarkStore.ts`): a `bookmarks.json` file in
Electron's user-data directory, loaded fail-safely (corrupt data degrades to
an empty collection) and saved debounced (300 ms) with an atomic tmp+rename
write, flushed on `before-quit`. The host-agnostic serialization lives in the
core (`packages/core/src/bookmarks/bookmarkPersistence.ts`). The
toolbar-visibility preference is kept in a separate `bookmarks-ui.json` so the
collection format stays pure. Deleting a folder moves its bookmarks to the
root — bookmarks are never lost. Bookmarks are stored locally on the device
and are never sent anywhere.

## SHODASHA History Manager

The History Manager is a chrome-rendered internal page at `shodasha://history`
(no custom scheme registration — it is a model-level URL, like the Privacy
Center and Bookmark Manager). Visit history is owned by a **single source of
truth**: the core `HistoryRecorder` held by the `HistoryCoordinator` in the
main process.

### Data model

History is an ordered log of visits (`packages/core/src/history/`). Each entry
records the page URL (only `http:`/`https:`, normalized for display but never
rewritten), the page title, an optional favicon URL, the first and latest visit
timestamps, and a running visit count. Entries carry a stable id derived from
their URL so repeated visits update one entry; reloads within a 5-second
window (`DUPLICATE_WINDOW_MS`) fold into the newest entry to keep the log
noisy-free.

### Recording boundary

- The `browserController` records genuine main-frame page loads
  (`did-navigate` and `did-navigate-in-page`) for the active tab. Only
  `http:`/`https:` URLs are recorded; SHODASHA internal pages
  (`shodasha://privacy`, `shodasha://bookmarks`, `shodasha://history`,
  `shodasha://ntp`) and `about:` pages are never recorded, and dangerous
  schemes are rejected before recording.
- Title and favicon are attached to the open entry as the page reports them;
  the favicon is only ever used as an `<img>` source.
- A per-tab navigation sequence (bumped on every navigation initiation) makes
  stale load events harmless: if an in-flight web load is superseded by a
  newer navigation (for example, opening an internal page while a page is
  still loading), its late `did-navigate` is ignored rather than overwriting
  the newer page.

### Retention and clearing

- The recorder keeps a bounded 10k-entry window, trimming oldest-first as new
  visits arrive (so history never grows without bound).
- The chrome UI offers search-by-title-or-URL, per-entry deletion, a
  time-range clear (last hour, last 24 hours, last 7 days, last 30 days, all
  time), and per-site clearing. Per-site clearing reuses the core's
  conservative `sameSite` registrable-domain matching, so clearing
  `example.com` also clears `www.example.com` but never
  `example.com.evil.com`.
- Every renderer input is validated in the main process; the renderer is never
  trusted.

### Persistence boundary

History survives restarts via `HistoryStore`
(`apps/desktop/src/main/historyStore.ts`): a `history.json` file in Electron's
user-data directory, loaded fail-safely (corrupt data degrades to an empty
log) and saved debounced (300 ms) with an atomic tmp+rename write, flushed on
`before-quit`. The host-agnostic serialization lives in the core
(`packages/core/src/history/historyPersistence.ts`). History is stored locally
on the device and never leaves it — no sync, no telemetry.

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
