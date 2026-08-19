# AGENTS.md — READ THIS FIRST (auto-loaded by agents)

This project runs on a **strict execution protocol**. Your task is **NOT complete** unless every rule below is satisfied. Do not start work until you have read this file and `Agent.md`.

---

## The 3 Non-Negotiable Rules

1. **No code before design approval.** Every feature follows: Spec → Clarify → Approve → Implement. You MUST ask clarifying questions and receive explicit user approval **before writing any code**.
2. **No implementation without loading the skill.** Before coding anything, consult `SKILLS.md`, pick the right skill, load it via the `skill` tool, and **read its `SKILL.md`**. Do not guess design or architecture decisions.
3. **No task complete without context sync.** Update **`context/progress-tracker.md`**, **`context/flow.md`**, and **`context/decision.md`** before declaring any task done.

---

## Read these files before any work

| # | File | Why |
|---|------|-----|
| 1 | `Agent.md` | The full execution protocol — MUST read before anything else |
| 2 | `SKILLS.md` | Master skill index — tells you which skill to load for what |
| 3 | `context/progress-tracker.md` | Where the project is right now (phase, done, next, open questions) |
| 4 | `context/flow.md` | How the app works — function call maps, user flows, request/response, routes |
| 5 | `context/decision.md` | Why the app is built this way — every library/architecture/feature decision + rationale |
| 6 | `context/architecture.md` | System boundaries, invariants, dependency direction |

---

## If you skip a step, the task FAILS

- **Skipping the design phase** → your code will be rejected.
- **Writing code without loading a skill** → your code will be rejected.
- **Not updating the three context files** → the task is incomplete, even if the code works.

---

## Ponytail — Write Less, Write Working Code

The **ponytail** plugin is installed **globally** in opencode (works in every IDE/session, every project). Apply it on every coding task:

- Laziest solution that actually works — shortest diff wins. Ask "does this even need to exist?" (YAGNI)
- Climb the ladder: reuse existing repo code → standard library → native features → installed deps → only then write the minimum new code
- No over-engineering: no speculative abstractions, no boilerplate, no config for values that never change
- Deletion over addition. Fix root causes, not symptoms. Boring over clever
- Leave one small runnable check for non-trivial logic
- Never skip: input validation, error handling that prevents data loss, security, accessibility, anything explicitly requested

Ponytail = WHAT (minimal working code). Design-First workflow = WHEN/HOW. Both apply together.

---

## Minimum compliance checklist (every task)

- [ ] Read `Agent.md` + `SKILLS.md` first
- [ ] Read `progress-tracker.md`, `flow.md`, `decision.md` before starting
- [ ] Loaded the right skill + read its `SKILL.md` (state which one)
- [ ] Design-first workflow followed (spec → clarify → approve → implement) — no code before approval
- [ ] Feature-first folder structure followed (no flat `components/`)
- [ ] Updated `progress-tracker.md`, `flow.md`, `decision.md`
- [ ] Lint / typecheck / build pass

Full protocol: `Agent.md`
