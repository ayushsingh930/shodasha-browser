# Flow Templates — Ready to Adapt

Copy the applicable template, adapt names/endpoints to your feature, and expand all
branches (happy, error, retry, offline).

## Auth: Sign Up / Login

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as /api/auth
    participant S as AuthService
    participant DB as Database

    U->>C: submit credentials
    C->>A: POST /api/auth/login
    A->>A: validate body
    A->>S: login(dto)
    S->>DB: find user by email
    DB-->>S: user
    S->>S: verify password (argon2)
    S-->>A: session token (httpOnly cookie)
    A-->>C: 200 + Set-Cookie
    C->>C: fetch /api/auth/me → cache user
    C-->>U: redirect to dashboard

    Note over A,S: Failure paths: 401 invalid creds, 429 rate-limit, 423 locked
```

## Checkout / Payment

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as /api/orders
    participant P as Payment Provider

    U->>C: place order
    C->>A: POST /api/orders
    A->>A: validate + authz (owner)
    A->>P: create intent
    P-->>A: client_secret
    A-->>C: 201 {client_secret, orderId}
    C->>P: confirm payment (tokenized card)
    P-->>C: success
    C->>A: POST /api/orders/:id/confirm (idempotent)
    A->>A: verify webhook/intent status
    C-->>U: order confirmation

    Note over A: Retry with same idempotency-key does NOT double-charge
```

## CRUD: Resource List / Create / Update / Delete

| Screen | Route | Endpoint | Method |
|--------|-------|----------|--------|
| List | `/app/items` | `/api/items` | GET |
| Create | `/app/items/new` | `/api/items` | POST |
| View | `/app/items/:id` | `/api/items/:id` | GET |
| Edit | `/app/items/:id/edit` | `/api/items/:id` | PUT/PATCH |
| Delete | detail | `/api/items/:id` | DELETE |

REST rules: validate at boundary, repo isolates DB, after-mutation cache invalidation
(`queryClient.invalidateQueries(['items'])`), optimistic UI with rollback on failure.

## File Upload

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as /api/uploads
    participant S as Storage (S3)

    U->>C: select file
    C->>C: client validation (type, size)
    C->>A: POST /api/uploads/presign {meta}
    A->>A: authz + quota check
    A-->>C: 200 {url, fields} (short-lived)
    C->>S: PUT file (direct to storage)
    S-->>C: 200
    C->>A: POST /api/uploads/complete {key}
    A->-S: verify object exists
    A-->>C: 201 file record
    C-->>U: success + preview
```

Add: quota exceeded, virus-scan pending, retry/resume, cleanup of orphaned uploads.

## Every Template's Universal Branches

For each flow, also draw/annotate:

- Validation failure (400) → inline field errors
- Unauthorized (401) → redirect to login, preserve intended route
- Forbidden (403) → permission screen
- Not found (404) → empty/recovery state, don't leak existence
- Rate limited (429) → backoff + retry
- Server error (500) → generic message + logged trace id
- Offline / timeout → retry with user-triggered retry button
- Conflict (409) → merge/reload or block with explanation