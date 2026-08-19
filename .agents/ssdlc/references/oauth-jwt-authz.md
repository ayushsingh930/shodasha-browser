# Auth & Authorization Deep-Dive

## Authentication (Who are you?)

### Sessions vs Tokens

| | Cookie Session | JWT |
|---|---|---|
| Storage | httpOnly cookie | httpOnly cookie preferred; never localStorage |
| Revocation | instant (server-side) | needs blocklist/rotation for instant kill |
| Stateless | no | yes |
| CSRF risk | yes — use SameSite=Strict/Lax + CSRF token | lower with SameSite + bearer not auto-sent |

**Rule of thumb**: httpOnly + Secure + SameSite cookies for web. Rotation + short
expiry for tokens.

### Password Handling

- Hash: **argon2id** (preferred) or **bcrypt** (cost ≥ 12). Never MD5/SHA1/plaintext.
- Per-user random salt (handled by the KDF).
- Rate-limit login attempts (per account + per IP), generic error messages
  ("invalid credentials" — never reveal which part was wrong).
- Enforce minimum entropy; allow password managers.

### Session/JWT Security Checklist

- [ ] `exp` short (15m–1h), refresh token rotates + revoked on reuse
- [ ] `iss`, `aud`, `iat` present; signature validated with a strong secret (≥32 bytes, env-injected)
- [ ] Reject `alg=none`; pin the algorithm (`HS256`/`ES256`)
- [ ] Tokens invalidated server-side on password change / logout / breach
- [ ] Store tokens in httpOnly cookies — NEVER localStorage/XSS-accessible storage
- [ ] Login with rate limiting + account lockout policy
- [ ] MFA for privileged accounts (if product scope requires)

## Authorization (What may you do?)

### Rules

1. **Enforce in the service layer on every request** — route guards/UI hiding is UX, not security.
2. **Never trust a role/flag from the client.** Derive roles server-side from the session/database.
3. **Ownership checks**: `WHERE owner_id = session.user_id` — never fetch by id then leak.
4. **Use an explicit model**: RBAC (roles), or ABAC (attributes/policies), or ReBAC (relationships) — choose one and document it.

### Model Comparison

| Model | Use When | Example |
|-------|----------|---------|
| RBAC | Simple org roles | admin / member / viewer |
| ABAC | Attribute-based conditions | owner-only, region-based |
| ReBAC | Complex relationships | workspace > project > doc permissions |

### Common Pitfalls

- Missing authz on GET-by-id endpoints (IDOR)
- Admin endpoints protected only by UI routing
- Role escalation through mass-assignment (validate input schemas strictly)
- Object-level vs route-level confusion — check per object, not per route

## CSRF, CORS, Clickjacking

- **CSRF**: SameSite=Strict/Lax cookies; anti-CSRF tokens for state-changing requests; for APIs require custom header (`X-Requested-With`) or bearer tokens
- **CORS**: explicit allowlist of origins; credentials only with exact origins; preflight handling for non-simple requests
- **Clickjacking**: `X-Frame-Options: DENY` or CSP `frame-ancestors`
- **Open redirects**: validate `redirect` params against an allowlist

## Verification Tests to Include

1. Request with no token → 401, no data leaked
2. Expired token → 401, clean re-auth path
3. User A accessing user B's resource → 403/404 (decide; 404 hides existence)
4. Tampered payload (price, role, userId) → rejected
5. CSRF attempt on state-changing endpoint → blocked
6. Login brute-force → rate-limited/locked
7. Privilege escalation attempt (member → admin) → 403
