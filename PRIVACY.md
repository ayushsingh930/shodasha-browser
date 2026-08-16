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
and browsing history are never collected or logged.

## Planned privacy features (roadmap, not yet implemented)

- Persistent filter lists with a list manager UI.
- Encrypted, at-rest storage for local data.
- Clear-browsing-data controls.
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
