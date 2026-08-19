# Deployment Hardening

## Transport & Headers

- TLS everywhere: prod + staging + API. Redirect HTTP → HTTPS. HSTS enabled.
- Application-level security headers (see api-security): CSP, nosniff, frame-ancestors, referrer-policy, HSTS.
- CORS: explicit origin allowlist; never `*` with credentials; preflight ok for non-simple methods.

## Application Platform

- Run as **non-root** in containers; drop capabilities; read-only root FS where possible
- Minimal base images; pinned tags; no debug tools in production images
- `npm ci --omit=dev` / `pnpm install --frozen-lockfile --prod` in builds
- Secrets via environment/secrets-manager at runtime — never baked into images
- Startup validation: required env checks that fail fast (missing secrets → crash with clear message, not silent default)

## Runtime protections

- Rate limiting at edge/app; request size limits; connection timeouts
- Graceful shutdown on SIGTERM; failed health checks → instance drain
- Health/readiness endpoints distinct from public data; don't expose internals

## Data

- Backups encrypted; restore tested regularly
- Database grants at minimum privilege per app; separate read/write where warranted
- Logs shipped off-host; retention defined; PII redaction as configured

## CI/CD Pipeline Security

- Secrets as secret-store references, not plaintext in pipeline vars where visible
- Sign artifacts or at least lockfile-pinned dependencies
- PR checks run semgrep/ESLint security + dependency audit + secret scanning
- Deploy approvals for prod; immutable, reproducible builds
- Risk of supply-chain injection — validate that CI doesn't `curl | sh` third-party

## Observability in prod

- Errors with trace ids surfaced into central logging/APM
- Alerts on: auth failure spikes, rate-limit hits, error-rate changes, availability drop
- Audit log for admin/destructive operations with actor + timestamp

## Verification

1. Fresh clone + `.env.example` → clean boot with placeholder values
2. `git secret scan` finds nothing
3. Perf build layers minimal; no dev deps in image
4. Prod routes respond with headers present
5. Health probe fails when DB down (readiness), app still serves liveness