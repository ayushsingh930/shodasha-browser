# UI/UX Design Principles — User Ka Dil Jeeto

> Source: Figma "UI vs UX", "Button States", "Product Design", "UX Validation" articles

## UI vs UX — Difference Kya Hai?

| UI (User Interface) | UX (User Experience) |
|---------------------|---------------------|
| Look & feel — colors, fonts, buttons | Overall experience — feel, flow, emotion |
| Visual design, micro-interactions | Research, testing, information architecture |
| How it looks | How it works |
| Surface level | End-to-end journey |
| Tools: Figma, color, typography | Tools: Research, journey maps, prototypes |

**Dono equally important hain** — UI attracts, UX retains.

## 7 UI Design Principles (Gestalt Inspired)

1. **Hierarchy** — Important cheezein prominent dikho
2. **Progressive Disclosure** — Sirf relevant info dikho, baaki on-demand
3. **Consistency** — Same patterns, same behavior everywhere
4. **Contrast** — Different elements visually distinguishable
5. **Accessibility** — Sab users ke liye usable
6. **Proximity** — Related items close rakho
7. **Alignment** — Har element ka koi na koi alignment reason

## Button States (All 9)

Tumhara startup tech hai toh buttons critical hain:

```
Normal → Hover → Active → Focus → Disabled → Loading → Error → Success → Visited
```

| State | Visual Change | CSS |
|-------|--------------|-----|
| Default | Normal style | `background: brand` |
| Hover | Darken 10% or lighten 10% | `:hover { opacity: 0.9 }` |
| Active/Pressed | Inner shadow, scale down | `:active { transform: scale(0.97) }` |
| Focus | Outline ring | `:focus-visible { outline }` |
| Disabled | 50% opacity, no pointer | `:disabled { opacity: 0.5 }` |
| Loading | Spinner icon + text hide | Show spinner overlay |
| Error | Shake animation + red border | Apply error state class |
| Success | Green check briefly | Temporary success state |
| Visited | Different color (30%) | `:visited { color }` |

**Transition:** 100-200ms (WCAG recommends 200ms+ for accessible animations)

## 5-Step UX Process

1. **Research** — User needs, pain points, competitors
2. **Define** — Problem statement, user stories
3. **Ideate** — Sketches, wireframes, brainstorming
4. **Prototype** — Clickable prototype in Figma
5. **Validate** — User testing, iterate, repeat

## UX Validation Checklist

Before development, validate:
- [ ] User completes primary task in <3 steps
- [ ] Error rate < 5% for critical flows
- [ ] Edge cases handled (empty states, errors, loading)
- [ ] Mobile flow tested (360px screen)
- [ ] Keyboard navigation works
- [ ] Screen reader test passed

## Product Design vs UX Design

| UX Design | Product Design |
|-----------|---------------|
| Focus on user experience | Focus on entire product |
| Screens, flows, usability | Strategy, business goals, vision |
| Research → Test → Iterate | Market → Build → Ship → Measure |
| Tactical | Strategic + Tactical |

**Product Design = UX Design + Business Strategy + Systems Thinking**

## Figma Tips for UI/UX

- **Interactive components** for button states — ek component mein saare states
- **Smart Animate** for smooth transitions
- **Dev Mode** for developer handoff
- **FigJam** for user journey mapping and brainstorming
- **Figma Make** for prompt-to-prototype AI workflow
- **Community templates** for UI inspiration
