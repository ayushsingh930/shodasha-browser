# AGENTS.md — Skill Index & Usage Guide

This file tells AI agents which skills are available and how to initialize/use them correctly.

---

## Skill Locations

There are **two locations** for skills in this template:

| Location | Purpose | Installed By |
|----------|---------|-------------|
| `.agents/` | Your custom/template-embedded skills | Always available — part of the template |
| `.agents/skills/` | Community skills from GitHub | `python Skills.py` (via `npx skills add`) |

---

## Available Skills

> The **master index** of everything is `SKILLS.md` at the repo root. Use it to find
> the right skill for the current task before scanning this file.

### Template-Embedded Skills (Always Available — `.agents/`)

These skills ship with the template — no installation needed.

| Skill | Path | Purpose | How to Initialize |
|-------|------|---------|-------------------|
| **design-basics** | `.agents/design-basics/SKILL.md` | UI/UX fundamentals: color, typography, layout, accessibility, spacing | Say: `I'll use the design-basics skill` — then read `guardrails.md` first |
| **redesign** | `.agents/redesign/SKILL.md` | Anti-fixation redesign: forces new designs, not shuffling. When user says "redesign" | Say: `I'll use the redesign skill` — then read `SKILL.md` for the 5-phase workflow |
| **premium-design** | `.agents/premium-design/SKILL.md` | Premium UI polish: design tokens, interaction patterns, premium aesthetics | Say: `I'll use the premium-design skill` — then read `SKILL.md` |
| **performance_engineering** | `.agents/performance_engineering/` | Core Web Vitals, Lighthouse optimization, performance best practices | Say: `I'll use performance_engineering` — then reference files in folder |
| **ui-checklist** | `.agents/ui-checklist/SKILL.md` | Component/page completeness checklists from checklist.design | Say: `I'll use ui-checklist` — then read `SKILL.md` |
| **tech-selection** | `.agents/tech-selection/SKILL.md` | Decide the tech stack deliberately: no random defaults, documented decision record | Say: `I'll use the tech-selection skill` |
| **folder-structure** | `.agents/folder-structure/SKILL.md` | Derive/materialize the folder structure per stack (frontend, backend, fullstack, mobile, monorepo) — canonical trees are the source of truth | Say: `I'll use the folder-structure skill`, then materialize its canonical tree for the stack |
| **design-patterns** | `.agents/design-patterns/SKILL.md` | Architecture design before code: classes, interactions, request flow, debugging, production readiness | Say: `I'll use the design-patterns skill` |
| **sitemap** | `.agents/sitemap/SKILL.md` | Map every page, route, hierarchy, and access level | Say: `I'll use the sitemap skill` |
| **user-flows** | `.agents/user-flows/SKILL.md` | User journeys + request/response sequence + route maps (mermaid) | Say: `I'll use the user-flows skill` |
| **ssdlc** | `.agents/ssdlc/SKILL.md` | Secure SDLC: STRIDE, auth/authz, secrets, SAST/SCA/DAST, hardening at every phase | Say: `I'll use the ssdlc skill` |

### Skills Installed via Skills.py (Run `python Skills.py` First — `.agents/skills/`)

These skills are downloaded and installed by the Skills.py bootstrap script into `.agents/skills/`.

| Skill | Located At (after install) | Purpose | How to Initialize After Install |
|-------|---------------------------|---------|-------------------------------|
| **design-taste-frontend** | `.agents/skills/design-taste-frontend/` | Anti-slop design: Three Dials (VARIANCE/MOTION/DENSITY), Design Read | Say: `I'll use design-taste-frontend` → Read SKILL.md → Set Three Dials |
| **high-end-visual-design** | `.agents/skills/high-end-visual-design/` | Agency-level polish: Double-Bezel, Button-in-Button, macro-whitespace | Say: `Using high-end-visual-design` → Apply premium patterns |
| **redesign-existing-projects** | `.agents/skills/redesign-existing-projects/` | Design quality gate: audit existing UI, upgrade without breaking | Say: `I'll use redesign-existing-projects` → Audit → Apply replacements |
| **full-output-enforcement** | `.agents/skills/full-output-enforcement/` | Ban placeholders, force exhaustive output generation | Say: `I'll enforce full output` → Load before planning/coding |
| **brandkit** | `.agents/skills/brandkit/` | Brand identity: colors, fonts, voice, logos | Say: `I'll use brandkit` → Reference brand guidelines |
| **imagegen-frontend-web** | `.agents/skills/imagegen-frontend-web/` | Web design image generation reference | Say: `I'll use imagegen-frontend-web` |
| **imagegen-frontend-mobile** | `.agents/skills/imagegen-frontend-mobile/` | Mobile design image generation reference | Say: `I'll use imagegen-frontend-mobile` |
| **image-to-code** | `.agents/skills/image-to-code/` | Convert design images to code | Say: `I'll use image-to-code` |
| **minimalist-ui** | `.agents/skills/minimalist-ui/` | Minimalist design patterns and principles | Say: `I'll use minimalist-ui` |
| **industrial-brutalist-ui** | `.agents/skills/industrial-brutalist-ui/` | Industrial/brutalist design patterns | Say: `I'll use industrial-brutalist-ui` |
| **stitch-design-taste** | `.agents/skills/stitch-design-taste/` | Stitch design taste patterns | Say: `I'll use stitch-design-taste` |
| **gpt-taste** | `.agents/skills/gpt-taste/` | GPT-augmented design taste engine | Say: `I'll use gpt-taste` |
| **hallmark** | `.agents/skills/hallmark/` | Design system: component recipes, macrostructures, references | Say: `I'll use hallmark` → Read SKILL.md → Reference cookbook |
| **Design Engineering** | `.agents/skills/emil-design-eng/` | Emil Kowalski's design eng: animation decisions, UI polish, details | Say: `I'll apply Emil's Design Engineering philosophy` → Read skill → Apply 4-question framework |
| **animation-vocabulary** | `.agents/skills/animation-vocabulary/` | Common animation terms and concepts | Say: `I'll use animation-vocabulary` |
| **apple-design** | `.agents/skills/apple-design/` | Apple's design principles and patterns | Say: `I'll use apple-design` |
| **find-animation-opportunities** | `.agents/skills/find-animation-opportunities/` | Identify where to add animations | Say: `I'll find animation opportunities` |
| **improve-animations** | `.agents/skills/improve-animations/` | Improve existing animations | Say: `I'll improve animations` |
| **review-animations** | `.agents/skills/review-animations/` | Review and critique animations | Say: `I'll review animations` |
| **GSAP Skills (8)** | `.agents/skills/gsap-*/` | GSAP animation: ScrollTrigger, timelines, motion patterns | Say: `I'll use GSAP skills` → GSAP-specific animation guidance |
| **Impeccable** | `.opencode/` or `.gemini/` | Full design engine: craft, shape, critique, audit, polish | Say: `I'll use Impeccable` → Use commands like `impeccable craft [feature]` |
| **Spec Kit** | System-wide (uv tool) | SDLC workflow automation: plan, tasks, implement commands | Use `specify` CLI commands |

---

## How to Initialize a Skill (Critical)

AI agents often do NOT automatically activate a skill just because its files exist. You must **explicitly initialize** the skill by following these steps:

### Step 1: Load the Skill
Say one of these phrases to activate the skill:
- `"I'll use the [skill-name] skill for this task"`
- `"Loading [skill-name] skill"`
- `"Applying [skill-name] principles here"`

### Step 2: Read the Entry Point
Read the skill's `SKILL.md` (or entry point file) to understand its rules:
- For `design-basics`: read `.agents/design-basics/guardrails.md` FIRST, then relevant module
- For `hallmark`: read `.agents/skills/hallmark/SKILL.md`, then reference the component-cookbook
- For `ui-checklist`: read `.agents/ui-checklist/SKILL.md`, then open the relevant section

### Step 3: Apply the Rules
Follow the skill's instructions literally — do not approximate or summarize.

### Step 4: Use Commands (if applicable)
- For Impeccable: use `impeccable craft`, `impeccable shape`, `impeccable critique`, etc.

---

## Recommended Skill Loading Order

**For a new-project / feature-design task (before writing ANY code):**
```
1. tech-selection      → Decide the stack deliberately (.agents/)
2. sitemap             → Map every page/route/access level (.agents/)
3. user-flows          → User journeys + request/response sequences (.agents/)
4. folder-structure    → Derive + materialize folders from canonical trees (.agents/)
5. design-patterns     → Design classes, interactions, request flow, production (.agents/)
6. ssdlc               → Embed security into the design (.agents/)
7. THEN design/implement    → Load design + dev skills below and build (.agents/)
```

For a UI design task:
```
1. design-taste-frontend    → Establish Design Read, set Three Dials (.agents/skills/)
2. design-basics            → Color, typography, spacing fundamentals (.agents/)
3. emil-design-eng          → Animation decisions, interaction polish (.agents/skills/)
4. high-end-visual-design   → Premium patterns, agency-level polish (.agents/skills/)
5. hallmark                 → Reference design patterns, components (.agents/skills/)
6. ui-checklist             → Verify completeness at the end (.agents/)
7. full-output-enforcement  → Before generating specs/plans (.agents/skills/)
```

For a redesign task (when user says "redesign", "revamp", "reimagine"):
```
1. redesign                 → Anti-fixation workflow: preservation check → assumption breaking → research → alternatives (.agents/)
2. design-basics            → Apply fundamentals to selected alternative (.agents/)
3. premium-design           → Polish the selected direction (.agents/)
4. ui-checklist             → Verify completeness (.agents/)
```
**CRITICAL:** Load `redesign` FIRST. Do NOT load design-basics or premium-design before Phase 4 — they will bias you toward the current design's patterns.

For a pure performance task:
```
1. performance_engineering   → Optimization strategies
2. GSAP Skills               → If animations need optimization
```

For a design audit of existing code:
```
1. redesign-existing-projects → Audit framework
2. high-end-visual-design     → Premium replacements
3. ui-checklist               → Completeness check
```

---

## Important Notes for AI Agents

1. **Skills are not auto-loaded.** You must explicitly activate them before use.
2. **Read the master index `SKILLS.md` (repo root) first** to pick the right skill for the task.
3. **Read the SKILL.md** — don't guess what a skill does.
4. **Follow the loading order** for cross-domain tasks to avoid conflicts.
5. **If a skill isn't found**, it may need to be installed via `python Skills.py`.
6. **Template-embedded skills** (in `.agents/`: design-basics, premium-design, performance_engineering, ui-checklist, tech-selection, folder-structure, design-patterns, sitemap, user-flows, ssdlc) are always available — no install needed. **Installed skills** (in `.agents/skills/`: GSAP, Taste, Emil, Hallmark, etc.) are available after running `python Skills.py`.
7. **After installing skills**, you may need to reload/restart the agent tool to detect them.
8. **Component libraries**: Always reference `DESIGN.md` before choosing UI libraries. Never default to a single library.
9. **Design psychology**: Read `DESIGN-PSYCHOLOGY.md` before any feature design. Use namethatui.com when the user describes UI vaguely.
10. **Astryx (Meta)**: Check `https://astryx.atmeta.com/docs/getting-started` first for production components.
11. **Folder structure**: Load the `folder-structure` skill and materialize its canonical trees. Follow the feature-first + layered pattern. No flat `components/` or `utils/` folders.
12. **Never use `npm install --force` or `npx install --force`** — resolve dependency conflicts properly.
13. **Context sync (MANDATORY)**: After every task, update `context/progress-tracker.md`, `context/flow.md`, and `context/decision.md`. See the Context Sync Protocol in `Agent.md`. `flow.md` tracks how functions call each other; `decision.md` is the append-only log of every choice + why. Never skip these — a task without context sync is not complete.
14. **Read before work**: `context/progress-tracker.md` + `context/flow.md` + `context/decision.md` give an instant picture of the project (state, structure, rationale). Read all three before starting.