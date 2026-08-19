# Mobile Structure Reference (React Native / Expo / Flutter)

Deep-dive of the canonical mobile structure. Maps the same layered ideas
(model → config → service → repository → controller) to a mobile app.

## Canonical Tree

```
src/
├── app/                         # navigation root / tabs / initial routing
│   └── (tabs)/
├── navigation/                  # typed route definitions, linking config
├── screens/                     # one folder per screen (composition layer)
│   ├── home/
│   └── surveys/
│       ├── SurveyList.screen.tsx
│       └── SurveyDetail.screen.tsx
├── components/                  # reusable UI
│   └── ui/                      # design primitives
├── models/                      # domain types (Survey, User, Question)
├── services/                    # network + external API calls
├── repositories/                # persistence/cache (AsyncStorage, SQLite)
├── controllers/                 # state orchestration per screen (hooks/stores)
├── config/                      # app config, env, feature flags
├── store/                       # global state (if needed)
├── hooks/                       # generic reusable hooks
├── utils/                       # pure helpers
└── types/                       # shared types
```

## How to Decide Where a File Goes

| File | Home |
|------|------|
| Full screen tied to a route | `screens/<screen>/` |
| Reusable presentational component | `components/` (promote to `components/ui/` on reuse) |
| Domain entity type | `models/` |
| API call (login, list surveys) | `services/` |
| Local offline cache / persistence | `repositories/` |
| Screen state + data orchestration | `controllers/` (one controller per screen) |
| Env, theme, feature flags | `config/` |
| Global cross-screen state | `store/` |

## Rules

1. **Screens are thin** — render, delegate to controllers.
2. **Services only talk to the network**; **repositories only own persistence/cache**.
3. **Controllers combine data + state** and expose a small API to the screen.
4. **Offline-first** when data matters: repositories serve cache-first with background refresh.
5. **Navigation is typed and defined in one place** — never stringly-typed routes scattered.
6. **No business logic in components** — components render, controllers decide.

## Request Flow (offline-capable)

```
Screen mounts → controller.load()
  → repository.list() (cache-first)
    → cache hit → render immediately → background refresh via service
    → cache miss → service.list() → HTTP → persist to local → render
    → failure + no cache → error state with retry
```