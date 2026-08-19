# API / Input / Output Security Hardening

## Input Validation (at every boundary)

Principles: **allowlist over denylist**, **validate shape + content**, **fail closed**.

- Schema validation (zod/joi/pydantic/class-validator) on every request body, query, params, headers
- Type coercion strictness: reject unexpected fields where sensible (prevents mass-assignment)
- Length limits on all strings; number ranges; enum allowlists
- Rate limit on auth, password reset, OTP, comment/upload endpoints
- Size limits on body (JSON depth + bytes), file uploads (bytes + count), pagination (`max limit`)

### Injection Defenses

| Vector | Rule |
|--------|------|
| SQL | parameterized queries / ORM only. No string interpolation |
| NoSQL | validate query operators; don't build Mongo queries from user keys |
| LDAP / shell | avoid; never build from input; escape |
| Command | never `child_process` with user input; spawn with array args only |
| Path traversal | `path.resolve` + verify target stays inside allowed root |
| XSS | escape on output, CSP, React auto-escaping, no `dangerouslySetInnerHTML` without sanitization |
| XXE | disable external entities in XML parsers (or skip XML entirely) |
| SSRF | block private networks; allowlist external hosts; no redirect following |

## Output / Information Disclosure

- Error messages to client: generic; detailed diagnostics to logs only (with trace id)
- No stack traces, DB dumps, or internal paths in responses
- No `Backend wrote: serialized object` leaks in JSON responses (map to DTOs, don't return ORM entities)
- Headers: strip server version banners

## Response Headers (Production)

```
Content-Security-Policy: <tight allowlist>
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: <minimal>
```

## File Uploads

- Size + count caps; MIME allowlist (verify magic bytes, not just extension)
- Random cryptographic storage names; store outside static webroot if possible
- Serve with `Content-Disposition: attachment` and `Content-Security-Policy` that blocks scripts
- Virus scanning for user-facing content; never execute uploaded files

## Logging & Observability (security-flavored)

- Structured logs with `requestId` correlation
- Redact Authorization, Cookie, client secrets, passport/identity fields
- Log security events: auth failure/success, rate-limit hits, permission denials, admin actions, file uploads
- Never log raw request bodies containing passwords/credit cards (mask at middleware)

## Verification Tests

1. Oversized payload → 413, no crash
2. Invalid enum/type → 400 with clean error
3. SQLi attempt (`' OR 1=1`) → no data leak, no error leak
4. Path traversal in filename → blocked
5. XSS payload in comment → rendered as text (escaped)
6. Unexpected fields in body → rejected (no mass assignment)