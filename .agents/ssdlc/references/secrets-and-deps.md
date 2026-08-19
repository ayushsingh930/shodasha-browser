# Secrets & Dependency Hygiene

## Secrets Management

### Rules

1. **Never hardcode secrets** — keys, tokens, passwords, connection strings.
2. **`.env` is gitignored**; commit only `.env.example` with placeholder values.
3. **Inject via environment** at runtime (or a secrets manager: Vault, AWS Secrets Manager, Doppler).
4. **Rotate on demand** — every leak means rotation, not just deletion of the line.
5. **Logs never contain secrets** — redact authorization headers, tokens, passwords, PII.
6. **CI never prints secrets** — masked values in pipeline logs.

### Checklist

- [ ] `git log -p` scan for accidental commits of secrets (and `git filter-branch`/`bfg` if leaked)
- [ ] `.gitignore` includes `.env`, `*.pem`, `*.key`, credential files
- [ ] Default secrets (e.g., `change-me`) rejected by config validation at boot
- [ ] Secrets for prod ≠ dev ≠ staging (separate stores)
- [ ] DB creds are least-privilege (app user can't drop tables)
- [ ] Third-party keys scoped to the minimum permissions (read-only where possible)

## Dependency Security

### Rules

1. **Lockfile committed** (`package-lock.json`, `pnpm-lock.yaml`, `uv.lock`).
2. **CI installs from lockfile** (`npm ci`, `pnpm install --frozen-lockfile`).
3. **Scan on every PR**: `npm audit`, `pip-audit`, `osv-scanner`, Snyk, Dependabot/Renovate.
4. **No known-vulnerable versions with a fix available** — blocking gate.
5. **Pin exact versions** for direct deps; ranges only where rotation is fast.

### Checklist

- [ ] Audit output reviewed, not ignored (fail CI on high/critical)
- [ ] Transitive deps scanned too (they are the usual attack surface)
- [ ] Regenerated lockfiles reviewed before merge
- [ ] Unused dependencies removed (each dep is attack surface)
- [ ] No `curl | bash` style installs in project scripts; no `--force` installs

## Supply Chain / SBOM

- Track what ships: `sbom` generation (syft, `npm sbom`) for releases
- Verify package integrity: lockfile hashes, registry pinning
- Be careful with postinstall scripts — audit them when adding new deps
- Vendored/patched packages reviewed manually

## Verification Tests

1. Commit a dummy secret → pre-commit/CI hook blocks it
2. `npm audit --audit-level=high` returns non-zero when a known vuln exists
3. Prod build fails when required env vars are missing
4. Log output of a failed login contains no password/token material
