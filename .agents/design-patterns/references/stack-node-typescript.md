# Node / TypeScript Backend Pattern Card

Apply this card when the backend is Express, Fastify, NestJS, or plain Node + TS.
Keep the universal core in `SKILL.md` as the foundation.

> **Right-size first.** If the endpoint is a single `SELECT` with no business rules,
> the controller calls the repository directly — do NOT wrap one line in three classes.
> Add Service only when there is real business logic, and Repository only when there
> are meaningful queries to abstract and test.

## Standard Layer Map

```
Route/Controller  →  Service  →  Repository  →  Data Source (DB/external API)
   (HTTP I/O)        (business       (data        (ORM, SQL, REST client)
                        rules)        access)
```

## Class Templates

### Controller — HTTP boundary
- @ modifier: parse `req`, validate input, call exactly ONE service method, map errors to HTTP statuses, format response
- NO business logic
- Pattern: thin handler + DTO mapping

```ts
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    const dto = loginSchema.parse(req.body);          // validation at boundary
    const result = await this.authService.login(dto); // business logic
    res.json(mapLoginResponse(result));               // response contract
  }
}
```

### Service
- Holds business rules, orchestration, transactions
- Depends on repositories and other services, never on `req`/`res`
- Throws typed domain errors, never HTTP-shaped errors

```ts
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,   // abstractions, not impls
    private readonly logger: Logger,
  ) {}

  async login(input: LoginDto): Promise<Session> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) throw new NotFoundError('user');
    // ...verify password, issue token, maybe send event
  }
}
```

### Repository — data access abstraction
```ts
export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> { /* queries */ }
  async create(data: CreateUser): Promise<User> { ... }
}
```

## Patterns to Apply

- **Repository**: isolates Prisma/TypeORM/SQL. Services never see SQL. Swap in tests with an in-memory repo.
- **Service Layer**: keeps controllers thin and logic in one testable place.
- **Dependency Injection**: constructor injection; keep `new` out — use a DI container or factory function composition.
- **DTO/Mapper**: validate + transform at the boundary. Never leak DB models to routes or clients untouched.
- **Error hierarchy**:
```ts
class AppError extends Error { constructor(public code: string, msg: string, public status = 500) { super(msg) } }
class NotFoundError  extends AppError { constructor(res='resource') { super('NOT_FOUND', `${res} not found`, 404) } }
class ValidationError extends AppError { constructor(msg: string) { super('VALIDATION', msg, 400) } }
```
   One global error-handling middleware maps `AppError → HTTP`, unknown → 500 + log stack, never leak internals.

## Request Flow (Express example)

```
Client → auth middleware (JWT verify → req.user)
       → [validation middleware] → controller parses DTO → service
       → repository → DB
       ← DB row ← repository maps to domain
       ← service composes result + publishes event (mail/webhook)
       ← controller formats response → JSON
       ← error middleware on throw → typed error → status + trace id
```

## Production Checklist

- [ ] Logging with `requestId`/`correlationId` passed via middleware (pino/winston)
- [ ] Error middleware is the ONLY place that decides HTTP statuses
- [ ] Rate limiting, CORS whitelist, helmet headers
- [ ] Validation as close to the boundary as possible
- [ ] Timeouts: external calls wrapped with AbortController + retry w/ backoff via p-retry/axios-retry
- [ ] Graceful shutdown (`SIGTERM` → close server + DB pool)
- [ ] Migrations versioned + run as deploy step, not on boot
- [ ] Config from env, typed + validated at boot (fail fast)
- [ ] Health check endpoint (`/health`), readiness vs liveness