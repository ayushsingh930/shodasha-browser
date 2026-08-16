# SHODASHA Browser — Security

## Security philosophy

SHODASHA is **secure by default**. Security is not a bolt-on; it is designed
into the foundation so that every future feature inherits safe defaults.

We operate strictly within legitimate browser and network mechanisms. SHODASHA
never implements DRM bypass, paywall bypass, authentication bypass, CAPTCHA
bypass, anti-bot evasion, unauthorized media extraction, protected-stream
downloading, website exploitation, malware injection, or circumvention of
security controls.

## Core principles

1. **Least privilege.** Each component is granted only the access it needs.
2. **Defense in depth.** Multiple independent layers protect the same asset.
3. **Fail closed.** When unsure, refuse and log nothing sensitive.
4. **No secrets in code.** Credentials come only from the environment.

## Baseline hardening (already in the foundation)

- **Context isolation** enabled for every `BrowserWindow`.
- **Node integration** disabled in renderers.
- **Renderer sandbox** enabled.
- **`webSecurity`** on; insecure mixed content blocked.
- **External links** open in the system browser, never in the app chrome.
- **Content-Security-Policy** set on the renderer document.
- **Preload bridge** exposes only a minimal, typed surface.

## SHODASHA Shield — security posture

- **Real cancellation, nothing weaker.** Filtering is enforced with Electron's
  `webRequest` at the network layer. Certificate validation, TLS, and
  `webSecurity` are never weakened; `webSecurity` is never disabled to
  "improve" filtering, and no site, rule, or mode can disable HTTPS/cert
  checks.
- **Fail-open by design.** An unclassifiable request, an unknown first-party,
  an evaluation error, or a malformed rule always resolves to ALLOW — never
  a block and never a crash. Blocking only ever happens for a request that
  matched a validated, active rule of an active category.
- **Rules are validated at load time.** Rules with invalid hostnames,
  resource types, or party scopes are rejected when a list is loaded and
  reported via the accepted count; no malformed rule can enter matching.
- **Decision cache cannot go stale.** The bounded decision cache is keyed
  with a context version that changes on every rule, mode, allowlist, or
  per-site change, and is cleared on each change — stale or bypassable
  decisions are impossible.
- **No interception side effects.** The request pipeline is read-only with
  respect to web content: it inspects headers/URLs of filterable requests
  only to classify and match them, and it cancels only blocked requests. It
  never tampers with cookies, headers, or certificates, and it cannot be
  reached by web content — it lives in the main process.
- **Privacy-safe instrumentation.** Recent filter events and per-site stats
  are in-memory only, hold hostnames and categories — never full URLs, query
  strings, or payloads — and are never persisted.
- **Filter lists are explicit.** Every list must declare `license`,
  `updatedAt`, and `provenance`; nothing is bundled silently. The bundled
  list is a demo test list using reserved `.test` domains only.
- **The Privacy Center is unreachable from web content.** `shodasha://privacy`
  is a chrome-rendered internal page. It is not a registered scheme and the
  privileged bridge (`window.shodasha`) exists only in the chrome renderer;
  the sandboxed webview has no `window.shodasha`, `process`, or `require`.
- **All IPC inputs are validated in the main process.** Per-site settings and
  allowlist entries are normalized through hostname validation before they
  touch the engine; malformed input is rejected, never partially applied.
  Bookmark add/update inputs are validated the same way (`javascript:`,
  `data:`, `file:`, and other dangerous schemes are rejected before anything
  is stored).
- **Settings persistence is scoped and fail-safe.** Only Shield settings
  (global on/off, mode, per-site, allowlist) are written to disk, in a
  debounced, atomic write. Statistics, events, and browsing activity are never
  persisted. A corrupt settings file degrades to defaults instead of crashing.

## SHODASHA Bookmark Manager — security posture

- **Bookmarks are data, never code.** A bookmark is a validated URL string
  plus display text. Opening one is a normal navigation exactly like typing
  the URL; bookmarks are never executed, rendered into privileged context, or
  injected into a page.
- **Strict URL validation.** Only `http:`, `https:`, and SHODASHA's own
  internal pages may be bookmarked. `javascript:`, `data:`, `file:`, and every
  other scheme are rejected in the main process before storage.
- **All bookmark IPC is validated in the main process.** Titles, URLs, folder
  ids, and folder names are type-checked and length-bounded; malformed input
  is rejected (or degrades safely), never partially applied. The renderer is
  never trusted.
- **Favicons are passive resources only.** A favicon captured from the active
  page is stored as a plain URL and the UI only ever uses it as an `<img>`
  source — it cannot execute or reach privileged APIs.
- **Bookmarks never leave the device.** The collection is stored locally in
  the user-data directory as JSON. There is no sync, no telemetry, and no
  upload of bookmark data.
- **The Bookmark Manager is unreachable from web content.** `shodasha://bookmarks`
  is a chrome-rendered internal page like the Privacy Center. The privileged
  bridge (`window.shodasha`) exists only in the chrome renderer; the sandboxed
  webview has no `window.shodasha`, `process`, or `require`.
- **Fail-safe persistence.** A corrupt bookmark file degrades to an empty
  collection instead of crashing; writes are atomic (tmp + rename) and
  debounced, and flushed on `before-quit`.

## SHODASHA History Manager — security posture

- **History entries are data, never code.** Opening an entry is a normal
  navigation exactly like typing the URL; stored history is never executed,
  rendered into privileged context, or injected into a page.
- **Strict URL recording.** Only genuine `http:`/`https:` main-frame page
  loads are recorded. SHODASHA internal pages and `about:` pages are never
  recorded, and dangerous schemes are rejected before recording.
- **All history IPC is validated in the main process.** Search terms, entry
  ids, clear ranges, and site hostnames are type-checked and normalized in the
  main process before they touch the recorder. Clear-range and per-site inputs
  are validated against a fixed allowlist of ranges and the core `sameSite`
  registrable-domain matcher — malformed input is rejected, never partially
  applied. The renderer is never trusted.
- **History is bounded and trimmable.** The recorder keeps a fixed 10k-entry
  window and trims oldest-first, so the log cannot grow without bound; the
  user can clear per-entry, by time range, or per-site at any time.
- **History never leaves the device.** The visit log is stored locally in the
  user-data directory as JSON. There is no sync, no telemetry, and no upload
  of browsing history.
- **The History Manager is unreachable from web content.** `shodasha://history`
  is a chrome-rendered internal page like the Privacy Center and Bookmark
  Manager. The privileged bridge (`window.shodasha`) exists only in the chrome
  renderer; the sandboxed webview has no `window.shodasha`, `process`, or
  `require`.
- **Fail-safe persistence.** A corrupt history file degrades to an empty log
  instead of crashing; writes are atomic (tmp + rename) and debounced, and
  flushed on `before-quit`.
- **Stale navigation events cannot corrupt state.** A per-tab navigation
  sequence guards load events so a late event from an in-flight web load can
  never overwrite a newer navigation (for example, an internal page opened
  while a web page was still loading).

## Explicit non-goals (never do these)

- Execute arbitrary remote code.
- Expose unrestricted filesystem APIs to web content.
- Expose unrestricted shell or process APIs to web content.
- Use `eval` for application logic.
- Store passwords or sensitive data in plaintext.
- Log passwords, cookies, authentication tokens, or sensitive form data.

## Secrets management

- Secrets are read exclusively from the process environment
  (`packages/core/src/security/secrets.ts`).
- There are **no hardcoded API keys** and no committed secrets.
- `.env` is git-ignored; only `.env.example` is committed.
- Sensitive values are length-bounded and redacted before logging.

## Logging policy

The logger (`packages/core/src/logging/logger.ts`) refuses to emit sensitive
topics. Sensitive content is replaced with `[REDACTED]` before it can reach a
log sink.

## Responsible disclosure

If you believe you have found a security vulnerability in SHODASHA, please
report it privately to the maintainers. Do not disclose it publicly until it
has been addressed.
