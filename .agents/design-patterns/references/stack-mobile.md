# Mobile Pattern Card (React Native / Expo / Flutter)

Apply this card for mobile apps. Universal core in `SKILL.md` applies.

## Standard Layer Map

```
Screens  →  Controllers/Stores  →  Services  →  Repositories  →  Remote (API) / Local (DB/cache)
   UI          state logic           network      persistence        AsyncStorage, SQLite
```

## Module Templates

### Models — domain shapes
```ts
export interface Survey { id: string; title: string; questions: Question[]; }
```

### Services — network boundary
```ts
export const surveyService = {
  async list(): Promise<Survey[]> { return http.get('/surveys'); },
  async get(id: string): Promise<Survey> { return http.get(`/surveys/${id}`); },
  async submit(id: string, answers: Answer[]): Promise<void> { return http.post(`/surveys/${id}/submit`, { answers }); },
};
```

### Repositories — persistence/cache (offline-first)
```ts
export class SurveyRepository {
  constructor(private local: LocalStore, private remote = surveyService) {}
  async list(): Promise<Survey[]> {
    const cached = await this.local.get('surveys');
    try { const fresh = await this.remote.list(); await this.local.set('surveys', fresh); return fresh; }
    catch { if (cached) return cached; throw new OfflineError('No surveys available offline'); }
  }
}
```
Mobile rule: **offline-first** — write-through or read-through cache, queue mutations when offline.

### Controllers — state per screen
```ts
export function useSurveysController() {
  const repo = useSurveyRepository();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [state, setState] = useState<Loading | Success | Error>('loading');
  const load = useCallback(async () => { ... }, []);
  useEffect(() => { load(); }, [load]);
  return { surveys, state, refresh: load };
}
```

## Patterns to Apply

- **Navigation tree defined in one place** (`navigation/`), typed routes (Expo Router / React Navigation types).
- **One controller hook per screen** — screens render, controllers orchestrate, services talk to the network, repositories own persistence.
- **Offline queue** for writes; conflict resolution strategy defined up front.
- **Platform adapters** — one interface, native vs web impl (Adapter pattern).
- **Pull-to-refresh, skeletons, error retry** on every data screen (see `States.md`).

## Request Flow

```
Screen mounts → controller.load() → repository.list()
  → cache hit → show immediately (stale-while-revalidate) → background refresh
  → cache miss → service.list() → HTTP → save to local → render
  → failure + no cache → error state with retry button
```

## Production Checklist

- [ ] No insecure storage of tokens — use SecureStore/Keychain, never plain AsyncStorage for secrets
- [ ] App start: splash → check session → deep-link handling
- [ ] Background/foreground refresh strategies, push notification token lifecycle
- [ ] Error boundaries per screen; global crash reporting wired (Sentry)
- [ ] Network state handling: offline banner, queued mutations, retry
- [ ] Bundle size: lazy-load screens, tree-shake native deps
- [ ] A11y: screen reader labels, font scaling, touch target sizes
- [ ] Environment config: dev/staging/prod via app config, not hardcoded