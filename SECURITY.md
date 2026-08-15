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
