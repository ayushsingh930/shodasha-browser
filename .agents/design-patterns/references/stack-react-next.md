# React / Next.js Frontend Pattern Card

Apply this card for any React or Next.js frontend. Universal core in `SKILL.md` applies.

> **Right-size first.** A page that just fetches and renders can be
> `Component + useQuery` in two files. Only add Service/Repository/Controller layers
> when the feature has real network + caching + state orchestration complexity. Never
> create layers that have no code to hold.

## Standard Layer Map (per feature)

```
UI (components)  →  Controller (state)  →  Service (network)  →  Repository (cache/persistence)
     presentational      logic/state          API calls         server-state, storage
```

## Module Templates (per feature folder)

### Model — data shapes
```ts
// features/auth/model/auth.ts
export interface User { id: string; email: string; name: string; plan: string; }
export interface LoginPayload { email: string; password: string; }
```
Pure types/schemas. No logic.

### Service — network boundary
```ts
// features/auth/service/auth.service.ts
export const authService = {
  async login(payload: LoginPayload): Promise<Session> {
    const res = await http.post('/auth/login', payload);   // shared api client
    if (!res.ok) throw new ApiError(res.status, await res.json());
    return res.json();
  },
};
```
One function per endpoint. Use the shared API client — no raw `fetch` scattered around.

### Repository — persistence / cache layer
```ts
// features/auth/repository/auth.repository.ts
export function useLogin() {
  return useMutation({
    mutationFn: authService.login,           // service call
    onSuccess: (session) => { tokenStore.set(session.token); queryClient.setQueryData(['session'], session); },
    onError: (err) => { tokenStore.clear(); },
  });
}
export function useSession() {
  return useQuery({ queryKey: ['session'], queryFn: () => getSession(), staleTime: 5 * 60_000 });
}
```

### Controller — orchestrates state + side-effects for pages
```ts
// features/auth/controller/useAuthController.ts
export function useAuthController() {
  const login = useLogin();
  const session = useSession();
  const isSubmitting = login.isPending;
  return { session, isSubmitting, login: login.mutateAsync };
}
```

## Patterns to Apply

- **Feature-first folders** — a feature owns model/service/repository/controller/components/hooks (see folder-structure skill).
- **Controller/Selector pattern** — pages call a single controller hook; the feature owns how state + data combine.
- **TanStack Query** for server state; **light client state** (zustand/context) for UI-only state. Separate the two.
- **Optimistic updates** for mutations with rollback.
- **Error boundary** per feature + **global error fallback**.
- **Composition over props-drilling** — compound components or context, not 15 required props.

## Request Flow (Next.js page example)

```
User clicks "Login"
  → useAuthController.login()  → repository useLogin mutation
    → authService.login()        → shared api client → POST /api/auth/login
      → [200] store token + cache session under ['session']
      → component re-renders from query cache → redirect router.push('/dashboard')
    → [4xx/5xx] ApiError → controller surfaces message → form shows inline error
```

## Debuggability

- Server components + client components labeled; `logger` available on both with `component` context
- Query invalidation is explicit — mutations know which keys to invalidate
- No magic in `useEffect` for server sync — that's what the repository layer is for

## Production Checklist

- [ ] Route-level code splitting (`next/dynamic`, `React.lazy`), profiler-based where hot
- [ ] Caching strategy: stale-while-revalidate, avoid re-fetch storms
- [ ] All fetches go through the typed API client (base URL, credentials, interceptors)
- [ ] Forms: validation client + server side, disabled submit while pending
- [ ] No `console.log` in prod paths — use a logger abstraction
- [ ] Error states for every fetch (see `States.md`)
- [ ] Bundle watches: no giant dep added casually
- [ ] A11y: keyboard, focus, reduced-motion