# Project Name

> [Short tagline — 1 sentence describing what this project does]

## Tech Stack

[Replace with your tech stack]

- **Framework**: Next.js 16 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Animation**: Motion (Framer Motion), GSAP
- **UI Library**: Mixed from DESIGN.md — Astryx, Animata, Skipper UI, etc.
- **Package Manager**: npm or pnpm

## Getting Started

```bash
# Install dependencies
npm install

# 1. Install skills (AI agent design/development skills)
python Skills.py

# 2. Install Spec Kit (SDLC workflow commands — run AFTER Skills.py)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@latest
specify init .

# Run development server
npm run dev
```

## Project Structure

```
├── .agents/         # AI agent skills (embedded + installed)
│   ├── tech-selection/         # Decide the tech stack
│   ├── sitemap/                # Map pages/routes/hierarchy
│   ├── user-flows/             # User journeys + request/response flows
│   ├── folder-structure/       # Derive + scaffold folder structure
│   ├── design-patterns/        # Architecture, patterns, request flow, production
│   ├── ssdlc/                  # Secure Software Development Lifecycle
│   ├── design-basics/
│   ├── premium-design/
│   ├── performance_engineering/
│   └── ui-checklist/
├── context/         # Project context files (fill these in)
│   ├── progress-tracker.md   # Where the project is (phase, done, next) — update every task
│   ├── flow.md               # How it works — function call maps, user flows, routes
│   └── decision.md           # Why it's built this way — every decision + rationale
├── src/             # Application source code (feature-first)
│   ├── app/         # Next.js App Router
│   ├── features/    # Feature modules (model/config/service/controller/repository)
│   ├── shared/      # Shared UI, hooks, utilities
│   └── entities/    # Domain models
├── Agent.md         # Agent execution protocol
├── DESIGN.md        # Curated component library references
├── SKILLS.md        # Master skill index — find the right skill
├── Skills.py        # Skill installer
└── README.md        # This file
```

## Design Resources

- **DESIGN.md** contains the curated list of allowed component libraries and design tools
- **Astryx (Meta)** is the primary reference for production-grade components
- Premium animated libraries: Animata, Cult UI, Skipper UI, React Bits Pro, etc.

## Skills

Skills are in `.agents/`. **First read `SKILLS.md`** (the master index) to find the
right skill for what you're building. Then run `python Skills.py` to install the
community skills. See `.agents/AGENTS.md` for details.

**After running Skills.py, you MUST also run specify to install the SDLC workflow commands:**

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@latest
specify init .
```

This unlocks the `/speckit.*` commands (speckit.specify, speckit.plan, speckit.tasks, etc.).

## Structuring a New Project

After `npm install` (create-app boilerplate), impose this project's hierarchy on it.
Load the `folder-structure` skill (`.agents/folder-structure/`) and materialize its
canonical tree for your stack — feature-first frontend, controller-service-repository
backend, or the fullstack/mobile/monorepo variants. Only create folders the product
actually needs; let the feature-first pattern grow the tree.

## Essential Skills (in `.agents/`)

| Skill | What it does |
|-------|--------------|
| `tech-selection` | Decide the stack deliberately, no random defaults |
| `sitemap` | Map every page, route, hierarchy, access level |
| `user-flows` | User journeys + request/response sequence + route maps |
| `folder-structure` | Derive/scaffold folder structure per stack |
| `design-patterns` | Classes, interactions, request flow, debugging, production readiness |
| `ssdlc` | Secure SDLC: threat modeling, auth/authz, secrets, gates per phase |
| `design-basics` | UI/UX fundamentals |
| `premium-design` | Premium UI polish |
| `performance_engineering` | Core Web Vitals, Lighthouse optimization |
| `ui-checklist` | Component/page completeness checklists |

## Important Rules

- Never default to a single UI library — always reference DESIGN.md
- Never use Mantine, Chakra UI, MUI, Ant Design
- Follow feature-first folder structure (Agent.md)
- Never use `npx install --force` or `npm install --force`

## License

[License type]