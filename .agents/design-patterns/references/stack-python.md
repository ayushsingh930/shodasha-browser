# Python Backend Pattern Card (FastAPI / Django)

Apply this card for Python backends. Universal core in `SKILL.md` applies.

## Standard Layer Map

```
Router/View  →  Service  →  Repository  →  Data Source (SQLAlchemy/Django ORM/external API)
```

## FastAPI Template

```
app/
├── api/                # routers + request/response schemas
│   ├── deps.py         # DI: db session, current_user
│   ├── v1/
│   │   ├── auth.py
│   │   └── users.py
│   └── errors.py       # exception handlers
├── core/               # config, logging, security (JWT, hashing)
├── models/             # SQLAlchemy models (DB entities)
├── schemas/            # Pydantic DTOs (in/out contracts) — separate from models
├── services/           # business logic
├── repositories/       # data access
└── main.py
```

### Router — HTTP boundary
```python
@router.post("/auth/login")
def login(payload: LoginIn, service: AuthService = Depends(get_auth_service)):
    return service.login(payload)
```

### Service — business rules
```python
class AuthService:
    def __init__(self, repo: UserRepository, security: SecurityService):
        self.repo = repo
        self.security = security

    def login(self, payload: LoginIn) -> SessionOut:
        user = self.repo.find_by_email(payload.email)
        if not user or not self.security.verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="invalid credentials")
        return SessionOut(access_token=self.security.create_token(user))
```

### Repository — data access
```python
class UserRepository:
    def __init__(self, db: Session):
        self.db = db
    def find_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))
```

## Patterns to Apply

- **Pydantic schemas ≠ ORM models** — never return models directly; map to output schemas (DTO pattern).
- **FastAPI DI via `Depends`** — constructor-style injection, makes testing with fakes trivial.
- **Repository** isolates SQLAlchemy — services stay DB-agnostic.
- **Custom exception hierarchy + central handlers** — `AppError` → `HTTPException` mapping in `errors.py`; unknown exceptions logged and mapped to 500 with a trace id.
- **Service-per-use-case**, not one god service per entity.

## Request Flow (FastAPI)

```
Client → middleware (CORS, request-id, auth JWT → request.state.user)
       → router → Pydantic validation → service → repository → DB
       ← service builds output schema ← error → exception handler → JSON detail
```

## Django Notes

- Same layering: **views are controllers** (thin), business logic in `services/` or use-case modules, queries in `repositories/` or managers.
- DRF serializers = DTO layer. Keep business logic out of them.
- Use Django's ORM but abstract behind repository functions for testability.
- Signals only for decoupled side-effects; never put business rules in them.

## Production Checklist

- [ ] `app/core/config.py` reads env via pydantic-settings; fail fast on missing required values
- [ ] Structured logging with request-id middleware; no bare `print`
- [ ] Central exception handlers with trace ids
- [ ] Slow query watch: N+1 avoided (selectinload/joinedload), pagination on all lists
- [ ] Migrations (Alembic) versioned; no autocrash on boot
- [ ] Background tasks via queue (Celery/ARQ) — never long sync work in request handler
- [ ] Rate limiting, CORS allowlist, security headers
- [ ] Health endpoint + graceful shutdown for uvicorn workers