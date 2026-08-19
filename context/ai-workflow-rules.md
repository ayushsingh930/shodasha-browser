# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch. Before writing code, load the relevant skill(s) and follow their instructions.

## SDLC Workflow

Every feature follows this sequence in order:

1. **Specify** — Create a feature specification from a natural language description. Defines WHAT to build (user stories, requirements, success criteria). No implementation details.
2. **Clarify** — (Optional) Resolve ambiguities in the spec by asking targeted questions.
3. **Plan** — Create an implementation plan with technical context, architecture decisions, data model, and research. Defines HOW to build it.
4. **Tasks** — Break the plan into executable, dependency-ordered tasks.
5. **Analyze** — (Optional) Cross-artifact consistency and quality analysis.
6. **Implement** — Execute all tasks in phases (Setup → Foundational → User Stories → Polish).

## Scoping Rules

- Work on one feature unit at a time (one spec → one plan → one task list → implement)
- Prefer small, verifiable increments over large speculative changes
- Do not combine unrelated system boundaries in a single implementation step

## When to Split Work

Split an implementation step if it combines:
- UI changes across multiple pages (do one page at a time)
- Frontend components and backend/CMS integration
- Behavior not clearly defined in the context files

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Skill Loading Order

Before implementing any feature, load skills in this order:

1. **`DESIGN-PSYCHOLOGY.md`** — Read applicable chapters (user psychology, cognitive biases)
2. **`design-taste-frontend`** — Establish design read, set Three Dials
3. **`design-basics`** — Apply fundamentals (color, typography, spacing, accessibility)
4. **`Design Engineering`** — Animation Decision Framework
5. **`high-end-visual-design`** — Agency-level polish
6. **`full-output-enforcement`** — For exhaustive output, ban placeholder patterns
7. **`hallmark`** — Reference design patterns and macrostructures
8. **`Astryx`** — Reference Meta's production-grade design system for components and tokens

## Component Selection Protocol

1. Open `DESIGN.md` and review the curated library list
2. If the user describes UI vaguely, use **namethatui.com** to translate to exact component names
3. **Always check Astryx first** for standard components (buttons, forms, tables, dialogs, nav)
4. For animated/premium sections (hero, pricing, FAQ): Animata, Cult UI, Skipper UI, React Bits Pro
5. For utility components: COSS UI, HeroUI, or Astryx
6. **Never default to HeroUI** — it is one option among many
7. **Never use Mantine, Chakra, MUI, Ant Design** — not allowed
8. Mix and match across libraries — do not commit to one library

## Project Structure Enforcement

- **Frontend**: Feature-first (see `Agent.md` for the full structure)
- **Backend**: Controller-Service-Repository pattern (see `Agent.md`)
- **No flat `components/` or `utils/` folders** — organize by feature
- **No cross-feature imports** — promote shared code to `entities/` or `shared/`
- **Every feature has a public `index.ts`** — no deep imports into feature internals

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files
- If a requirement is ambiguous, resolve it in the relevant context file before implementing
- If a requirement is missing, add it as an open question in `progress-tracker.md`

## Protected Files

Do not modify the following unless explicitly instructed:
- `src/shared/ui/*` — generated primitives
- `node_modules/`, `.next/`, build output directories

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:
- System architecture or boundaries → `architecture.md`
- UI decisions (colors, typography, components) → `ui-context.md`
- Code conventions or standards → `code-standards.md`
- Feature scope or workflow → `ai-workflow-rules.md`
- Progress → `progress-tracker.md`
- Functions, routes, APIs, or user flows → `flow.md` (call maps, sequence diagrams)
- Any meaningful choice (library, pattern, branch, approach) → `decision.md` (append an ADR entry with the choice + why)

> `progress-tracker.md`, `flow.md`, and `decision.md` are the three **living** files —
> they are updated on EVERY task. The others are updated only when their topic changes.

## Reading the Three Living Files

Before starting any task, read all three to understand the project instantly:
1. `progress-tracker.md` — current phase, done, next, open questions
2. `flow.md` — function call maps, user flows, request/response flows
3. `decision.md` — every decision made so far + why

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. Build passes
5. Lint passes
6. Typecheck passes
7. Folder structure follows feature-first convention

## Prohibited Practices

- **No `npx install --force` or `npm install --force`** — resolve dependency conflicts properly
- **No single-library default** — always reference DESIGN.md and mix libraries
- **No flat folder structures** — always organize by feature/domain
- **No cross-feature imports** — use `entities/` or `shared/` for shared code