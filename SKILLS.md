# SKILLS.md — Find The Right Skill

This is the **master index**. When you (or an AI agent) need to do something, come
here first, pick the right skill, read its `SKILL.md`, then apply it. **Skills are
not self-loading — you must explicitly activate the one you need.**

Quick navigation:
- [What skill should I use?](#decide-what-to-do-then-pick-a-skill)
- [Project Setup & Architecture Skills](#project-setup--architecture)
- [Design & UX Skills](#design--ux)
- [Performance Skills](#performance)
- [Security Skills](#security)
- [SDLC & Workflow Skills](#sdlc--workflow)
- [Helper Tools & Docs](#helper-tools--docs-in-the-template)

---

## Decide What To Do, Then Pick a Skill

> **Before you advise, classify the product.** Is it a marketing page, a client-only
> tool, an interactive web app, a fullstack product, a mobile app, or a desktop app?
> Every skill must be applied at the CORRECT scale — a marketing page needs almost none
> of this. When in doubt: right-size. 10 lines that do the work beat 100 that "scale."

| What you're doing | Use this skill → | Where |
|-------------------|------------------|-------|
| Building a new project, don't know the stack | `tech-selection` (classifies the product first) | `.agents/tech-selection/` |
| Deriving the folder structure / scaffolding | `folder-structure` (canonical trees — materialize by hand) | `.agents/folder-structure/` |
| Designing the architecture: classes, patterns, request flow, debugging, production | `design-patterns` | `.agents/design-patterns/` |
| Mapping the pages / hierarchy of the product | `sitemap` | `.agents/sitemap/` |
| Mapping user journeys + request/response flows | `user-flows` | `.agents/user-flows/` |
| Shifting security into every dev phase (SSDLC) | `ssdlc` | `.agents/ssdlc/` |
| Designing any UI / visual look | `design-basics` + `premium-design` + `DESIGN-PSYCHOLOGY.md` | `.agents/design-basics/`, `.agents/premium-design/` |
| Optimizing performance | `performance_engineering` | `.agents/performance_engineering/` |
| Auditing a component/page for completeness | `ui-checklist` | `.agents/ui-checklist/` |

**Best planning order** (right-size every step to the product type):

```
tech-selection → sitemap → user-flows → folder-structure → design-patterns → ssdlc
```

Then implement. Load each skill's `SKILL.md` as you begin its phase.

## The Rules That Apply To Every Skill

1. **Understand the product first.** Is it a single web app, UI-only, fullstack,
   mobile, desktop? The AI must identify the product type before planning anything.
2. **Never over-engineer.** No layer, library, folder, or pattern the product doesn't
   actually need. YAGNI + KISS.
3. **Write minimum code.** A 10-line solution that works beats a 100-line one that
   "scales."
4. **Never invent requirements.** Don't add auth, admin, billing, or caching if the
   user never asked.
5. **Plan in the order above, then code.** Never jump straight to implementation.

---

## Project Setup & Architecture

### `tech-selection` — Decide the technology stack
- **When**: new project, or choosing a library/framework for a feature.
- **What**: converts requirements → concrete stack (language, frontend, backend,
  DB, state, testing, deploy) with a documented decision record. No random defaults.
- **Activate**: `I'll use the tech-selection skill` → read `.agents/tech-selection/SKILL.md`

### `folder-structure` — Derive the right folder structure
- **When**: new project or "where does this file live?" or before scaffolding.
- **What**: canonical trees for frontend (feature-first + model/config/service/controller/
  repository), backend (controller-service-repository), fullstack, mobile, monorepo.
  The trees are the source of truth — create the folders by hand from them (npm
  provides the boilerplate, this skill provides the hierarchy).
- **Path**: `.agents/folder-structure/`

### `design-patterns` — Design before code
- **When**: before implementing any non-trivial feature — decide the classes/modules,
  how they interact, the request flow, error strategy, debugging, production readiness.
- **What**: universal architecture core + per-stack pattern cards (TS/Node, React/Next,
  Python, mobile, monorepo).
- **Activate**: `I'll use the design-patterns skill` → read `.agents/design-patterns/SKILL.md`

---

## Design

| Skill | When | Path |
|-------|------|------|
| `redesign` | **Anti-fixation redesign** — forces new designs, not shuffling. When user says "redesign", "revamp", "reimagine", "start from scratch" | `.agents/redesign/` |
| `design-basics` | Colors, typography, layout, spacing, a11y fundamentals | `.agents/design-basics/` |
| `premium-design` | Polish the UI until it looks premium/professional | `.agents/premium-design/` |
| `ui-checklist` | Verify pages/components/flows are complete | `.agents/ui-checklist/` |
| `DESIGN-PSYCHOLOGY.md` | Understand user psychology before ANY feature design | root |
| `DESIGN.md` | Pick component libraries (never default to one) | root |

Installed design skills (after `python Skills.py`):
`design-taste-frontend`, `high-end-visual-design`, `brandkit`, `image-to-code`,
`apple-design`, `minimalist-ui`, `industrial-brutalist-ui`, `hallmark`,
`Emil Design Engineering`, GSAP skills. See `.agents/AGENTS.md`.

---

## Security

| Skill | When | Path |
|-------|------|------|
| `ssdlc` | Every phase: threat modeling (STRIDE), auth/authz, secrets, SAST/SCA/DAST, deployment hardening, security gates | `.agents/ssdlc/` |

Activate before writing ANY security-relevant code; never bolt security on at the end.

---

## SDLC & Workflow

| Tool / Skill | Purpose | Note |
|--------------|---------|------|
| Spec Kit (`specify`) | Spec-driven SDLC commands: specify, plan, tasks, implement | Install AFTER skills.py |
| `Agent.md` | Execution protocol: design-first workflow, structure, rules | read first |
| `context/progress-tracker.md` | Where the project is NOW (phase, done, next, questions) | keep synced every task |
| `context/flow.md` | HOW it works: function call maps, user flows, request/response | keep synced when code changes |
| `context/decision.md` | WHY it's built this way: every decision + rationale | append on every meaningful choice |
| `context/*.md` | Project context: overview, architecture, standards | keep synced |

## Reading a project quickly

Read these three files to instantly understand any project based on this template:

```
context/progress-tracker.md   → where it is
context/flow.md               → how it works
context/decision.md           → why it's built this way
```

---

## Helper Index

- **AGENTS.md** (`.agents/AGENTS.md`) — full list incl. community-installed skills
- **Agent.md** — the project's execution protocol (reading order + rules)
- **States.md** — universal UI state checklist (empty/loading/error/etc.)
- **Skills.py** — bootstrap community skills into `.agents/skills/`

---

## Rules of Thumb

1. **Always activate the skill explicitly** — files existing is not enough.
2. **Read `SKILL.md` of the chosen skill** — don't guess.
3. **Design-first**: plan the map/folders/architecture/security before code.
4. **Update `context/`** when choices change — this index reflects living state.