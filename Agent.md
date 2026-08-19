# Agent Execution Protocol

**This file is the law of this repository.** Read it fully before doing anything. It defines the mandatory routine, the design gate, skill usage, folder structure, and the context sync protocol. **Violating any rule in this file means the task is NOT done.**

> Start here → then read `SKILLS.md` (master skill index) → then read the three context files that explain the project.

---

## The 3 Non-Negotiable Rules

1. **No code before design approval.** Every feature: Spec → Clarify → Approve → Implement. Never skip the approval gate.
2. **No implementation without loading the skill.** Load the right skill via the `skill` tool and **read its `SKILL.md`** before writing code. Do not guess design decisions.
3. **No task complete without context sync.** Update `context/progress-tracker.md`, `context/flow.md`, and `context/decision.md` before declaring any task done.

---

## The 3 Files That Explain This Project

Anyone — human or AI — can understand this project instantly by reading these three files in `context/`:

| File | Tells you |
|------|-----------|
| `context/progress-tracker.md` | Where the project is NOW (phase, done, next, open questions) |
| `context/flow.md` | HOW it works (function call maps, user flows, request/response, routes) |
| `context/decision.md` | WHY it is built this way (every decision + rationale) |

**Read all three before starting any task.** Keep them updated after every task.

---

## Mandatory Routine — EXECUTE THIS FOR EVERY TASK

This is the only allowed way to work in this project. Do not skip steps, do not reorder them.

### Step 0: Read Context (non-negotiable, before anything)
Read all of these:
1. `Agent.md` (this file)
2. `SKILLS.md` (skill index)
3. `context/project-overview.md` (what/why)
4. `context/progress-tracker.md` (current state)
5. `context/flow.md` (how the app works)
6. `context/decision.md` (why decisions were made)

### Step 1: Classify the Task
Determine which skill domain the task belongs to (design / architecture / security / performance / UI). Consult the **Skill Mapping Table**.

### Step 2: Load the Skill (before any code)
Activate the skill explicitly and read its `SKILL.md`. In your response, **state the skill you loaded and one rule from it that you will apply.** If no skill matches, say so and ask the user.

### Step 3: Design-First (for every feature — see workflow below)
Produce the spec, visualize the design, **ask clarifying questions**, then **get explicit user approval**.

### Step 4: Implement
Only after approval: Plan → Tasks → Build.

### Step 5: Sync Context
Update `progress-tracker.md`, `flow.md`, and `decision.md` with what you did.

### Step 6: Verify
Run all **Pre-Exit Checks**.

---

## Required Response Format (shows compliance)

While working on a task, begin each response with a short status block so compliance is visible:

```
Status: read-context | spec | clarify | approve | plan | implement | verify
Skills loaded: <skill name + SKILL.md path>
Context read: <files>
Context updated: <files>
```

If the block is missing, the user should treat the task as non-compliant.

---

## How to Use This File

1. Read the **Context Hierarchy** below before writing any code
2. Consult **`SKILLS.md`** (repo root) — the master skill index — to pick the right skill
3. Follow the **Design-First Feature Workflow** — map the product, spec, design structure, visualize, clarify, approve, then build
4. Follow the **Project Structure Standards** — load the `folder-structure` skill and materialize its canonical trees per stack
5. Identify which **domain** your task belongs to using the **Skill Mapping Table**
6. Load the right skill(s) via the `skill` tool before implementing
7. Reference **DESIGN.md** for component library selection — never default to a single library
8. Reference **Astryx (Meta design system)** for production-grade components and tokens
9. Run **Pre-Exit Checks** before marking any task complete

---

## Context Hierarchy (Read in Order)

1. `context/project-overview.md` — Product definition, goals, features, scope
2. `context/architecture.md` — System structure, boundaries, storage model, invariants
3. `context/ui-context.md` — Theme, colors, typography, component conventions
4. `context/code-standards.md` — Implementation rules and conventions
5. `context/ai-workflow-rules.md` — Development workflow, scoping rules, delivery approach
6. `context/progress-tracker.md` — Current phase, completed work, open questions, next steps
7. `context/flow.md` — **Function call maps, user flows, request/response flows, routes** (how the app works)
8. `context/decision.md` — **Decision log** (every library/architecture/feature decision + why)

> The three "living" files — `progress-tracker.md`, `flow.md`, `decision.md` — are updated on **every** task. The others are updated only when their topic changes.

---

## Design-First Feature Workflow

**Before writing ANY code for a new feature, follow this exact sequence. Each step has a mandatory deliverable — you cannot skip a step and claim the task is in progress.**

### Step 1: Plan the Product Surface
Load `tech-selection` (if the stack isn't decided) + `sitemap` (map every page/route) + `user-flows` (map the journeys that matter).
**Deliverable**: a **site map**, **user flows**, and **request/response flows** for the feature.

### Step 2: Create Feature Spec
Create a feature specification in a `Feature_docs/<feature-name>/spec.md` file. This spec defines WHAT to build — user stories, requirements, success criteria.
**Deliverable**: the spec file.

### Step 3: Derive Structure & Architecture
Load `folder-structure` (materialize the canonical tree for the stack) then `design-patterns` to define the modules/classes, their interactions, the request flow, error strategy, and production-readiness checklist. Load `ssdlc` to embed security (threat model, authz, secrets) into the design.
**Deliverable**: module/class list + interaction diagram + request flow.

### Step 4: Load Design Skills & Visualize
Load the relevant design skills to shape a design vision. Create a **visual wireframe / component tree diagram** (ASCII or detailed layout description) that shows the page structure, section hierarchy, spacing, and visual rhythm.
**Deliverable**: the wireframe / component tree.

### Step 5: Ask Clarifying Questions
Ask the user clarifying questions about the design before proceeding.
**Deliverable**: the questions asked, and the user's answers.

### Step 6: Get User Approval — HARD GATE
Present the spec + wireframe/visualization to the user and **wait for explicit approval.**
**Do not write any code until the user explicitly approves.** If you write code before approval, the task is failed.

### Step 7: Implement
Only after approval, proceed with implementation: Plan → Tasks → Build.

---

## Project Structure Standards

> The **source of truth** for deriving any folder structure is the `folder-structure`
> skill (`.agents/folder-structure/`). Load it and materialize its canonical trees —
> the trees below are the canonical defaults.

### Frontend — Feature-First Architecture + Layered Features

Every Next.js project must follow this structure. Group code by business domain, not by file type, and layer each feature: **Model → Config → Service → Repository → Controller → Components/Hooks**.

```
src/
├── app/                          # Next.js App Router (routes, layouts, providers)
│   ├── layout.tsx                # Root layout (fonts, metadata, providers)
│   ├── page.tsx                  # Home page (thin composition layer)
│   ├── (auth)/                   # Route group for auth pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx
│       └── page.tsx
├── features/                     # Feature modules (self-contained, domain-driven)
│   ├── auth/                     # Example: Authentication feature
│   │   ├── model/                # Types, schemas, domain invariants (User, Session)
│   │   ├── config/               # Feature constants (token keys, ttl)
│   │   ├── service/              # Network calls: authService.login(), getMe()
│   │   ├── repository/           # Data access: query client, cache, optimistic updates
│   │   ├── controller/           # State orchestration: useAuthController(), store
│   │   ├── components/           # Feature-specific UI (LoginForm, AuthGuard)
│   │   ├── hooks/                # Feature-specific hooks (useAuth, useSession)
│   │   └── index.ts              # Public API — only exports from here
│   ├── billing/
│   │   ├── model/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── controller/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── dashboard/
│       ├── model/
│       ├── service/
│       ├── repository/
│       ├── controller/
│       ├── components/
│       ├── hooks/
│       └── index.ts
├── shared/                       # Business-agnostic reusable code
│   ├── ui/                       # Design system primitives (Button, Input, Modal)
│   ├── hooks/                    # Generic hooks (useDebounce, useMediaQuery)
│   ├── lib/                      # Pure utilities (formatDate, cn, validators)
│   ├── api/                      # HTTP client, interceptors
│   └── types/                    # Shared types
├── entities/                     # Domain models shared across features
│   ├── user/
│   │   ├── model/                # Types, schemas, invariants
│   │   └── index.ts
│   └── organization/
│       ├── model/
│       └── index.ts
├── config/                       # Runtime config, env vars, constants
│   └── index.ts
├── lib/                          # Low-level infrastructure
│   ├── api-client.ts             # Axios / fetch client
│   ├── query-client.ts           # TanStack Query setup
│   └── logger.ts
└── styles/                       # Global styles, design tokens
    ├── globals.css
    └── tokens.css
```

### Backend — Controller-Service-Repository Pattern

```
src/
├── controllers/                  # HTTP layer — request parsing, response formatting
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   └── billing.controller.ts
├── services/                     # Business logic layer
│   ├── auth.service.ts
│   ├── user.service.ts
│   └── billing.service.ts
├── repositories/                 # Data access layer (DB queries, external APIs)
│   ├── user.repository.ts
│   ├── billing.repository.ts
│   └── subscription.repository.ts
├── middleware/                    # Express/Next.js middleware
│   ├── auth.middleware.ts
│   ├── rate-limit.middleware.ts
│   └── validation.middleware.ts
├── validators/                   # Request validation schemas
│   ├── auth.validator.ts
│   └── billing.validator.ts
├── types/                        # Shared backend types
├── config/                       # Config, env vars, DB connection
├── utils/                        # Pure helpers
└── index.ts                      # App entry point
```

### Dependency Direction
```
app/ (pages) → features/ → entities/ → shared/
app/ (pages) → features/ → shared/
features/ → shared/
features/ → entities/
entities/ → shared/

NEVER: features/ → features/ (cross-feature imports)
NEVER: shared/ → features/ or entities/ (shared must not know about business logic)
NEVER: entities/ → features/ (domain models don't depend on workflows)
```

### Key Rules
1. **Each feature is a self-contained module** — owns its model, service, repository, controller, components, hooks
2. **Layer per feature**: Model → Config → Service → Repository → Controller → Components/Hooks
3. **Public API via `index.ts`** — external code imports only from `features/auth`, never deep paths
4. **Co-locate by domain** — tests, styles, and types stay next to the code they belong to
5. **Promote to `shared/` only on second use** — avoid premature abstraction
6. **`entities/` for stable domain models** — User, Product, Organization (not features)
7. **`app/` pages are thin** — they compose, not contain business logic
8. **For other stacks** (backend, fullstack, mobile, monorepo) use the `folder-structure` skill and its canonical trees

---

## Skill Mapping Table

All skills are in `.agents/`. **Always consult `SKILLS.md` (repo root) first** — it is
the master index telling you which skill to use for what.

| # | Domain | Skill | Location | When to Use |
|---|--------|-------|----------|-------------|
| 1 | **Tech Selection** | `tech-selection` | `.agents/tech-selection/` | Deciding the stack: language, framework, DB, state, deploy |
| 2 | **Site Map / IA** | `sitemap` | `.agents/sitemap/` | Mapping every page, route, hierarchy, access level |
| 3 | **User Flows** | `user-flows` | `.agents/user-flows/` | User journeys, request/response sequences, route maps |
| 4 | **Folder Structure** | `folder-structure` | `.agents/folder-structure/` | Deriving/materializing the project structure from its canonical trees |
| 5 | **Architecture & Patterns** | `design-patterns` | `.agents/design-patterns/` | Classes, interactions, request flow, debugging, production readiness |
| 6 | **Secure SDLC** | `ssdlc` | `.agents/ssdlc/` | Threat modeling, auth/authz, secrets, security gates per phase |
| 7 | **Design Fundamentals** | `design-basics` | `.agents/design-basics/` | Any visual decision: colors, typography, spacing, layout, accessibility |
| 8 | **Premium UI Polish** | `premium-design` | `.agents/premium-design/` | Making UI look premium/professional — typography, color, layout, tokens |
| 9 | **Performance Engineering** | `performance_engineering` | `.agents/performance_engineering/` | Optimizing performance, Core Web Vitals, Lighthouse scores |
| 10 | **UI/UX Checklist** | `ui-checklist` | `.agents/ui-checklist/` | Auditing components/pages for completeness |
| 11 | **Design Psychology** | `DESIGN-PSYCHOLOGY.md` | `DESIGN-PSYCHOLOGY.md` (root) | User describes UI vaguely, or before any feature design — understand psychology + systems thinking |
| 12 | **DESIGN.md** | Component Libraries | `DESIGN.md` (root) | Reference curated component libraries before writing UI code |
| 13 | **Redesign (Anti-Fixation)** | `redesign` | `.agents/redesign/` | User says "redesign", "revamp", "reimagine", "start from scratch" — forces new designs, not shuffling |
| 14+ | **Installed Skills** | Various | `.agents/skills/` | After running `python Skills.py` |

---

## Component Library Selection Protocol

1. **Always reference DESIGN.md** before choosing a component library
2. When the user describes a UI element in vague/layman terms, **use namethatui.com** (https://namethatui.com/) to translate their description into the correct component name
3. **Check Astryx (Meta) first** for standard UI patterns — buttons, forms, tables, dialogs, nav
4. For **animated/premium sections** (hero, pricing, FAQ): Animata, Cult UI, Skipper UI, React Bits Pro, Aceternity, MagicUI
5. For **utility components** (tabs, accordions, tooltips): COSS UI, HeroUI, or Astryx
6. **Never default to HeroUI** — it's one option among many, not the default
7. **Never use Mantine, Chakra, MUI, Ant Design** — these are not allowed
8. **Prefer CLI-installable or copy-paste** — shadcn registry, direct source. Own the code.
9. **Mix libraries** — a hero from one, pricing from another, forms from Astryx

> Whenever you choose a library, **append a decision entry to `context/decision.md`** explaining the choice and the alternatives rejected.

---

## Astryx (Meta) Design System — Primary Reference

URL: https://astryx.atmeta.com/docs/getting-started

Astryx is Meta's design system. It provides:

- **200+ production-grade components** — Button, Dialog, Table, Form fields, Navigation, Layout, Toast, etc.
- **Full design token system** — colors, spacing, typography, elevation, motion, shape
- **7 themes** — neutral, butter, chocolate, gothic, matcha, stone, y2k
- **Page templates** — full layouts and page shells
- **AI-specific components** — Chat Composer, Command Palette, Tokenized Text, Streaming Text
- **StyleX integration** — atomic CSS-in-JS for custom styling
- **CLI tool** — `npx @astryxdesign/cli init` to set up agent docs

**Always check Astryx first for any standard UI component before pulling from other libraries.**

---

## Design Psychology Protocol

Read `DESIGN-PSYCHOLOGY.md` for deep design knowledge. Use these resources before making design decisions:

### NameThatUI — Translate Vague User Descriptions
- **URL:** https://namethatui.com/
- **When:** The user says "the thing that does X" or describes a UI element in layman terms
- **What it does:** Translates vague descriptions into exact component names, ARIA roles, and HTML elements
- **Do this:** Go to the site, describe what the user said, find the real name, then build that component
- **Example:** User says "the dark layer behind the popup" → you find "Scrim (Backdrop)" → you build a `<dialog>` with `::backdrop`

### Product Design Psychology — Design Products People Love
- **URL:** https://productdesignpsychology.com/
- **When:** Before ANY feature design — especially forms, checkout flows, navigation, and onboarding
- **What it gives you:** 40 chapters on cognitive biases, user psychology, and organizational dynamics
- **Key principles to always apply:**
  - "Nobody Remembers Your UI" — design for recognition, not recall
  - "Design the Last Moment First" — start with the user's goal
  - "Fake Progress Is Real Motivation" — show progress, celebrate completions
  - "More Options Make Users Quit" — fewer choices = more conversions
  - "Layout Speaks Before You Do" — visual hierarchy communicates priority
  - "Your UI Is Exhausting" — minimize cognitive load at every step

### DesignSystems.com — Industry Best Practices
- **URL:** https://www.designsystems.com/
- **When:** Setting up design tokens, component architecture, typography, icons, accessibility
- **What it gives you:** Guides from Figma + case studies from Spotify, Atlassian, GitHub, Salesforce
- **Reference for:** Typography systems, grid/layout foundations, iconography, design token strategy

---

## Context Sync Protocol — UPDATE THESE AFTER EVERY TASK

Your task is not complete until these are updated. Sync happens at Step 5 of the Mandatory Routine and again if anything changes during implementation.

| File | Update when | What to write |
|------|-------------|---------------|
| `context/progress-tracker.md` | **Every** task | Completed work, current phase, next steps, open questions |
| `context/flow.md` | Functions/components/routes/API/flows change | Call maps, user flows, request/response flows, routes |
| `context/decision.md` | **Any meaningful choice** (library, pattern, branch, approach) | Append an ADR entry with the choice + why + alternatives rejected |
| `context/architecture.md` | Boundaries or invariants change | System structure, dependency direction |
| `context/ui-context.md` | Visual decisions (colors, type, components) | Theme, tokens, component conventions |

> Rule of thumb: if you had to think about something for more than a few seconds, **log it in `decision.md`**. If you touched any function/route/API, **update `flow.md`**. If you finished any work, **update `progress-tracker.md`**.

---

## Pre-Exit Checks (Before Marking ANY Task Complete)

1. Lint passes (e.g., `npm run lint`)
2. Typecheck passes (e.g., `npm run typecheck`)
3. Build passes (e.g., `npm run build`)
4. All animations respect `@media (prefers-reduced-motion: reduce)`
5. Only `transform` + `opacity` are animated — no layout properties
6. No hardcoded colors — all use CSS custom properties from `ui-context.md`
7. `progress-tracker.md` is updated with the completed work
8. `flow.md` is updated if functions/routes/APIs changed
9. `decision.md` has an entry for every meaningful choice made
10. Folder structure follows the feature-first convention (no flat `components/` dumping ground)

---

## Ponytail — Write Less, Write Working Code (CRITICAL)

**The `ponytail` plugin is installed globally in opencode** (`~/.config/opencode/opencode.json`, npm package `@dietrichgebert/ponytail`). It is **not tied to any IDE** — it is active in every opencode session on any project. Follow its principles on **every** coding task, in any repo:

- **Laziest solution that actually works.** Shortest diff that works wins. Ask "does this need to exist at all?" before building (YAGNI).
- **Climb the ladder**: reuse code already in the repo → use the standard library → use native platform features → use already-installed dependencies → **only then** write the minimum new code.
- **Never over-engineer**: no speculative abstractions, no interfaces with one implementation, no factories for one product, no config for values that never change.
- **Deletion over addition. Boring over clever.** One line before fifty.
- **Bug fix = root cause, not symptom.** Grep every caller of the function you're touching; fix it once where all callers route through.
- **Leave one runnable check** behind for non-trivial logic (a small assert-based self-check or one tiny `test_*.py`). No frameworks unless asked.
- **Never simplify away**: input validation at trust boundaries, error handling that prevents data loss, security, accessibility basics, anything explicitly requested.

Ponytail governs **what** to build (minimal, working, no bloat). The Design-First workflow still governs **when/how** you build it — both apply together.

---

## Git Discipline

1. **Branch naming**: `NNN-feature-name` (sequential) or `YYYYMMDD-HHMMSS-feature-name` (timestamp)
2. **Commits**: Use conventional commits — `type(scope): description`
3. **Never commit** to `main`/`master` directly — always use feature branches
4. **Commit messages**: `feat(scope): description`, `fix(scope): description`, etc.

---

## Important Rules

- **Never jump to coding.** Always follow the Design-First Feature Workflow — Step 6 (approval) is a hard gate
- **Never default to a single component library.** Mix and match from DESIGN.md
- **Before any feature design, read DESIGN-PSYCHOLOGY.md** — understand user psychology and cognitive biases first
- **When the user describes UI vaguely, use namethatui.com** to translate to exact component names
- **Never use `npx install --force` or `npm install --force`** — resolve dependency conflicts properly
- **Never create flat `components/` folders** — always organize by feature
- **After running Skills.py, MUST install specify:** `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@latest` then `specify init .` — this unlocks speckit.* SDLC commands
- **Load skills before writing code.** Do not guess design decisions. State the loaded skill in your response
- **Update `progress-tracker.md`, `flow.md`, and `decision.md` after every meaningful change**
- **If unsure about a design decision, ask the user**
