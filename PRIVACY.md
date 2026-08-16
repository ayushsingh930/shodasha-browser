# SHODASHA Browser — Privacy

## Privacy philosophy

SHODASHA puts the user in control of their own data. Privacy features are
**transparent and user-controlled** — the user decides what filtering is active,
and nothing is done covertly.

All privacy and content-filtering functionality operates through legitimate
browser and network mechanisms. SHODASHA does not circumvent paywalls,
authentication, DRM, or any security control.

## What the foundation establishes

The foundation defines the _contracts_ for privacy features without turning
them on yet:

- **Content filtering** (`packages/core/src/privacy/contentFilter.ts`): a
  typed model for filter lists, rules, and decisions. The engine contract
  (`ContentFilterEngine`) is host-agnostic.
- **A simple reference engine** (`simpleFilterEngine.ts`): a pure, in-memory
  substring matcher used to validate the contract and seed a future
  high-performance engine.
- **URL privacy utilities** (`packages/core/src/url/urlPrivacy.ts`): strips
  well-known tracking parameters and fragments. This is a standard,
  transparent privacy technique that does not circumvent any security control.

## SHODASHA Shield — what it does today

The Shield is a **real, rule-based request filter** wired into the desktop
request pipeline (`webRequest.onBeforeRequest`):

- **Blocking.** Requests matching an active, validated block rule of an
  active category are cancelled at the network layer. Matching is
  deterministic and rule-based; the Shield never blocks a request merely for
  being third-party.
- **Allowlist.** Per-site allowlisting is strict and scoped to the real
  domain — an allowlisted site stays usable on subdomains and can never be
  imitated by a lookalike suffix.
- **Modes.** STANDARD (ads, trackers, social-tracking, malicious-domains),
  STRICT (adds `other`), and CUSTOM (user-chosen categories). Strict mode is
  still rule-based — it never blocks all third-party traffic.
- **Per-site control.** Shield ON/OFF and per-site mode are explicit and
  visible in the browser UI.
- **Transparency.** The panel shows session counters, per-site counters, and
  a recent-activity feed (hostname + category + resource type only) so the
  user always sees exactly what was filtered.

## SHODASHA Privacy Center — the Shield dashboard

The Privacy Center is a SHODASHA-internal page (`shodasha://privacy`) rendered
by the chrome UI — never by the web content area — so external websites can
never reach it. It is the single place to review and control the Shield:

- **Protection overview.** Whether the Shield is on, which mode is active, and
  the current filter-list totals.
- **Protection status.** An honest status derived from the real engine state:
  **PROTECTED** (on, current site protected), **LIMITED** (on, but the current
  site's Shield is off), or **OFF** (globally off). The accompanying note is
  factual and never claims a "100% private" or guaranteed result.
- **Session statistics.** Real counters from the Shield engine (requests
  evaluated / allowed / blocked, ads filtered, trackers blocked) plus the
  current site's own counters. Nothing is fabricated or extrapolated.
- **Protection controls.** Global Shield ON/OFF, global mode, reset statistics,
  and per-site Shield control for the site you are currently viewing.
- **Filter lists.** Each loaded list with its name, rule count, version,
  license, and update metadata. Lists are local and never auto-downloaded
  (`updatesEnabled` is always false in this build).
- **Allowlist manager.** Add or remove allowlisted sites, with validation in
  the main process.
- **Recent protection activity.** The same hostname-only event feed as the
  popup.

### Privacy Center data handling

- **Persisted settings** (survive restarts): global Shield on/off, global
  mode, per-site settings, and the allowlist. These are stored locally as a
  JSON file in Electron's user-data directory.
- **Never persisted**: session statistics, recent events, and any browsing
  activity. After a restart, statistics begin at zero; nothing about what you
  visited is recorded on disk.

### What it does not do (and never will)

- It does **not** claim to block every ad or tracker. Rule-based filtering
  only ever blocks what a validated rule matches; the demo list covers
  reserved `.test` domains only, and real coverage requires importing lists
  with appropriate licenses.
- It does **not** rewrite page content, strip elements, or alter pages
  beyond cancelling matched requests.
- It does **not** bypass paywalls, DRM, authentication, or any security
  control, and it never weakens TLS or certificate validation.

### Filter list licensing

Lists are loaded through `FilterListSource`, which requires `license`,
`updatedAt`, and `provenance` metadata. The repository bundles a single
**demo test list** (`packages/core/src/shield/lists/demoFilterList.ts`) that
uses reserved `.test` domains (RFC 6761) — MIT-licensed, versioned, with a
provenance note. Real lists (e.g. EasyList-family) may be imported only when
their license permits the intended use, with their own metadata recorded.

### What the Shield never records

Filter events and statistics are session-only and in-memory: hostnames,
categories, resource types, and counters. Full URLs, query strings, payloads,
and browsing history are never collected or logged. The only thing persisted
on disk is the user's own **Shield settings** (global on/off, mode, per-site
settings, allowlist) — never statistics, events, or browsing activity.

## SHODASHA Bookmark Manager — local bookmarks

The Bookmark Manager is a SHODASHA-internal page (`shodasha://bookmarks`)
rendered by the chrome UI — never by the web content area — so external
websites can never reach it. It lets the user store, organize, search, and
open bookmarks:

- **Add / edit / delete.** The star button on the toolbar (or the page
  context menu's "Bookmark this page") adds the current page; bookmarked
  pages show a filled star and open the edit dialog. Bookmarks can be
  deleted from the manager.
- **Folders.** Bookmarks can be filed into folders; folders can be created,
  renamed, and deleted. Deleting a folder moves its bookmarks to the root —
  bookmarks are never lost.
- **Search and sort.** The manager filters titles and URLs locally (case
  insensitive) and can be sorted by recency or name.
- **Toolbar.** An optional bookmarks toolbar (Ctrl+Shift+B) shows unfiled
  bookmarks for one-click access.

### Bookmark data handling

- **Persisted locally** (survive restarts): the bookmark collection and the
  toolbar-visibility preference, as JSON files in Electron's user-data
  directory. Writes are atomic and fail-safe; a corrupt file degrades to an
  empty collection.
- **Never sent anywhere.** Bookmarks are stored on this device. There is no
  sync, no remote service, and no telemetry. Local search runs entirely on
  this device.
- **Never executed as code.** A bookmark is a validated URL string plus
  display text; opening one is a normal navigation. Only `http:`/`https:` and
  SHODASHA internal pages may be bookmarked.

## SHODASHA History Manager — local history

The History Manager is a SHODASHA-internal page (`shodasha://history`)
rendered by the chrome UI — never by the web content area — so external
websites can never reach it. It shows the pages you have visited on this
device:

- **Automatic recording.** Genuine `http:`/`https:` page loads are recorded
  locally with the page title, favicon, and visit time. Reloads within a 5
  second window are folded into a single entry so the log stays clean, and
  each page appears once with a visit count.
- **Search and clear.** The manager searches titles and URLs locally (case
  insensitive), deletes individual entries, clears a time range (last hour,
  24 hours, 7 days, 30 days, all time), or clears everything for one site.
- **Keyboard access.** Ctrl+H opens the History Manager; the same shortcut
  while it is already open focuses it.

### History data handling

- **Persisted locally** (survive restarts): the visit log, as a JSON file in
  Electron's user-data directory. Writes are atomic and fail-safe; a corrupt
  file degrades to an empty log. The log is bounded at 10,000 entries,
  trimming oldest-first.
- **Never sent anywhere.** History is stored on this device. There is no sync,
  no remote service, and no telemetry. Local search runs entirely on this
  device.
- **What is never recorded.** SHODASHA internal pages (`shodasha://history`,
  `shodasha://bookmarks`, `shodasha://privacy`, `shodasha://ntp`) and
  `about:` pages are never recorded, and dangerous schemes are rejected before
  recording.

## Planned privacy features (roadmap, not yet implemented)

- Filter-list manager UI with updates (lists are local and static in this
  build; `updatesEnabled` is always false).
- Encrypted, at-rest storage for local data.
- A Privacy Policy document aligned with these principles.

## Data handling

- No telemetry is implemented in this foundation build.
- Logs never contain passwords, cookies, auth tokens, or sensitive form data.
- Sensitive local data will always be encrypted at rest before it is stored.

## Principles

1. **User control.** Features are opt-in or clearly togglable by the user.
2. **Transparency.** What filtering is active is always visible.
3. **Minimization.** Collect and retain only what is necessary.
4. **Legitimacy.** Every mechanism is a standard browser/network technique.
