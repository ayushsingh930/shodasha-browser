---
name: ssdlc
description: >
  Use ONLY when security needs to be part of the development lifecycle: threat
  modeling, security requirements, secure design, secure coding, input validation,
  auth/authz, secrets handling, SAST/DAST/SCA, dependency scanning, security testing,
  deployment hardening, and security gates at every SDLC phase. Follows the Secure
  Software Development Lifecycle (SSDLC) across requirements → design → development →
  testing → deployment → maintenance. Do NOT use for UI/visual design or folder layout.
trigger: >
  User says "make it secure", "SSDLC", "threat modeling", "how do I handle secrets",
  "secure this API", "auth/authz design", "security checklist", "OWASP", "is this
  production-secure", or when writing code that handles user input, auth, payments,
  files, or external calls.
avoid_trigger: >
  Pure UI styling, folder structure, general performance tuning, animation, colors.
---

# Secure Software Development Lifecycle (SSDLC) Skill

## Purpose

Security is not a phase — it's a property of every phase. This skill ensures the
AI applies security thinking from requirements through maintenance, not just a
"security checklist" bolted on at the end.

## When to Use

- Starting a new project or feature — embed security from the first design pass
- Writing ANY code that accepts input, authenticates, authorizes, stores data, or calls external systems
- Before deploying anything to production
- When the user asks for a security review, threat model, or hardening

## The 7 SSDLC Phases (Follow in Order)

### Phase 1 — Requirements: Security Requirements

Define security requirements alongside functional ones.

- [ ] **Data classification**: what data is sensitive? (PII, credentials, payments, tokens, files)
- [ ] **Security requirements captured**: authentication type, authorization model, encryption in transit + at rest, retention/erasure (GDPR-style)
- [ ] **Compliance** applicability: GDPR, HIPAA, PCI-DSS, SOC2 (only if the product needs it — name it explicitly)
- [ ] **Trust boundaries**: which systems/actors are trusted? (client, server, third-party)
- [ ] **Abuse cases** listed — what does an attacker try to do?

**Deliverable**: security requirements section in the feature spec.

### Phase 2 — Design: Threat Modeling (STRIDE)

Before coding, threat-model each feature. Use STRIDE:

| Threat | Ask | Example Mitigation |
|--------|-----|-------------------|
| **S**poofing | Can an actor fake an identity? | strong auth, JWT signature validation, no trust in client-supplied identity |
| **T**ampering | Can data be modified in transit/storage? | TLS, HMAC/signatures, DB integrity |
| **R**epudiation | Can an action be denied? | audit logs, trace ids |
| **I**nformation disclosure | Can sensitive data leak? | least privilege, field-level authz, no secrets in responses/logs |
| **D**enial of service | Can the service be overwhelmed? | rate limiting, timeouts, quotas, CAPTCHA on public forms |
| **E**levation of privilege | Can a low-priv actor escalate? | server-side authz on every call, never trust role from client |

- [ ] Draw the data flow: every input boundary, every trust boundary
- [ ] For each threat, decide: mitigate / accept / transfer — with the chosen mitigation
- [ ] **Never rely on client-side checks** — authz is enforced in the service layer, not the UI

**Deliverable**: STRIDE table per feature + explicit "what we chose and why".

### Phase 3 — Secure Development: Coding Rules (OWASP Top 10)

While writing code, enforce these rules:

- [ ] **Input validation at every boundary** (API, forms, files, headers, query params) — allowlist > denylist; use schema validators (zod/joi/pydantic)
- [ ] **Parameterized queries only** — never string-concatenate SQL (SQL injection)
- [ ] **No XSS**: never `dangerouslySetInnerHTML` with unsanitized data; escape output; CSP header
- [ ] **Authz on every endpoint** — check ownership/role in the service layer, not just route guards
- [ ] **Password hashing**: argon2id/bcrypt with per-user salt; never plaintext, never MD5/SHA1
- [ ] **Session/JWT handling**: short-lived access tokens + refresh rotation, store in httpOnly cookies (not localStorage), sign with strong secret, include `iss/aud/exp`
- [ ] **Secrets never in code**: env vars, vault, `.env` gitignored, no hardcoded keys (see below)
- [ ] **File uploads**: size + type allowlist, random storage names, never serve user files from the app origin without Content-Disposition, scan
- [ ] **No insecure deserialization**: validate every parsed payload; avoid `eval`-like paths
- [ ] **Error handling**: generic client errors, detailed server logs only (information disclosure)

### Phase 4 — Secure Development: Secrets & Dependency Hygiene

- [ ] **Secrets**: `.env` in `.gitignore`, `.env.example` with placeholders, key rotation plan, never commit real keys — verify with `git log` / scanning
- [ ] **Dependencies**: `npm audit` / `pip-audit` / `osv-scanner` in CI; pin or lock (lockfile committed); no known-vulnerable versions
- [ ] **No debugging leftovers**: no `console.log` of payloads, no debug routes (`/debug`, backdoors)
- [ ] **SBOM mindset**: know what you ship (only what's in the dependency graph)

### Phase 5 — Security Testing (Gates Before Ship)

- [ ] **SAST** (static analysis): ESLint security plugins, Semgrep, CodeQL — run in CI on every PR
- [ ] **SCA** (dependency scanning): `npm audit`, `osv-scanner`, Dependabot/Renovate
- [ ] **DAST** (dynamic): run against staging for critical flows — OWASP ZAP / Burp baseline
- [ ] **Manual security review** of: auth, authz, payments, file handling, admin endpoints
- [ ] **Security test cases** in the test suite: invalid token, expired token, wrong-owner access, tampered payload, oversized input, rate-limit hit
- [ ] **Fuzzing-ish edge inputs**: Unicode, very long strings, null bytes, malformed JSON

### Phase 6 — Secure Deployment (Hardening)

- [ ] **TLS everywhere**; HSTS; `helmet`-style headers (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [ ] **CORS allowlist** — never `*` for credentialed endpoints
- [ ] **Least privilege** for DB/service accounts; separate prod/staging creds
- [ ] **Rate limiting + request size limits** at the edge/app
- [ ] **Health + startup checks**; secrets injected via environment/secret store, not images
- [ ] **Container/dependency hygiene**: non-root user, minimal base image, `npm ci` from lockfile
- [ ] **Logs redact** secrets and PII (structured logging with redaction)

### Phase 7 — Maintenance: Operations & Incident Response

- [ ] **Monitoring & alerting**: auth failures, rate-limit hits, 4xx/5xx spikes, suspicious patterns
- [ ] **Audit log**: who did what, when (especially admin/destructive actions), with trace ids
- [ ] **Patch cadence**: define how vulnerabilities are tracked and patched
- [ ] **Incident response plan**: how to rotate secrets, revoke tokens, rollback, communicate
- [ ] **Key rotation & backups**: tested restore, encrypted backups

---

## Security Gates (Blocking)

The following are **blockers** — do not mark a task complete if any apply:

1. Secrets hardcoded or committed
2. SQL built by string concatenation with user input
3. Authz missing on any non-public endpoint
4. Password stored without a proper KDF
5. Tokens in localStorage when httpOnly cookies are possible
6. Client-side-only security checks
7. Unrestricted CORS (`*`) on authenticated endpoints
8. Any debug/backdoor route in a production path
9. Unvalidated file uploads served directly
10. Known-vulnerable dependency with a fix available

## Files in This Skill

```
ssdlc/
├── SKILL.md                          ← this file (entry point)
└── references/
    ├── oauth-jwt-authz.md            ← auth & authorization deep-dive
    ├── secrets-and-deps.md           ← secrets, dependencies, SBOM
    ├── api-security.md               ← API/input/output hardening
    └── deployment-hardening.md       ← headers, CORS, TLS, containers
```

## Handoff

- Threat model flows feed the `user-flows` request/response skill
- Security constraints belong in the `design-patterns` design contract
- After every phase gate: update `progress-tracker.md`
