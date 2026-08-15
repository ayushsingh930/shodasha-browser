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

## Planned privacy features (roadmap, not yet implemented)

- User-controlled tracker and advertising blocking via declarative rules.
- Per-site content-filter toggles.
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
