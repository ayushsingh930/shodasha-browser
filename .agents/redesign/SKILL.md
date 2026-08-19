---
name: redesign
description: >
  Anti-fixation redesign skill. Forces AI to create fundamentally new designs instead of
  shuffling existing elements. When the user says "redesign", this skill activates to
  prevent design fixation — the tendency to protect the first draft and only make variations.
  The AI must explore at least 2 radically different directions, research global examples,
  break assumptions, and create groundbreaking alternatives. Never just move things around.
trigger: >
  User says "redesign", "make it look different", "refresh the design", "revamp",
  "overhaul", "reimagine", "rethink the UI", "this looks dated/boring/ugly",
  "make it modern", "redesign this section/page/component", "start from scratch",
  "I want something completely different".
avoid_trigger: >
  "Make it better" (unless they say redesign), "fix this bug", "add this feature",
  "improve accessibility", "make it faster", "optimize", pure functionality changes,
  backend/API work, data structure changes, testing, deployment.
---

# Redesign Skill — Break the Fixation

## The Problem This Skill Solves

**Design fixation** makes your first idea feel better than it is. Once the current design exists, most "exploration" becomes small variations on it instead of real alternatives. You get motion, polish, rearranging, and refinement — but no distance, surprise, doubt, or a fresh angle.

This happens to AI too. When asked to "redesign", AI typically:
- Moves elements around the same layout
- Changes colors slightly
- Swaps fonts
- Adjusts spacing
- Calls it a "redesign"

**That is not a redesign.** That is decoration.

---

## When This Skill Activates

**Trigger when** the user says any of:
- "Redesign this section/page/component"
- "Make it look different"
- "I want something completely different"
- "This looks boring/ugly/dated"
- "Revamp/overhaul/reimagine/rethink the UI"
- "Start from scratch"
- "Refresh the design"
- "This needs a redesign"

**Do NOT trigger** when:
- User asks to "fix" something specific (bug fix, accessibility, performance)
- User asks to "add" a feature (new functionality)
- User asks to "improve" something (could be optimization, not redesign)
- Pure backend/API work

---

## The 5-Phase Anti-Fixation Workflow

### Phase 1: PRESERVATION CHECK (Before Any Design Work)

**ASK THE USER FIRST** — before looking at any code or design:

> "Before I redesign, what should I preserve from the current design?
> - Content/copy (text, images, data)?
> - Brand identity (colors, fonts, logo)?
> - Specific elements that work well?
> - Nothing — start from absolute zero?"

**Document the answer.** This is your constraint list — everything else is fair game.

---

### Phase 2: ASSUMPTION BREAKING (The Core of This Skill)

**DO NOT look at the current design yet.** Or if you must, identify every assumption it makes, then design the opposite.

**Step 2a: List every assumption in the current design**

Ask yourself:
1. What layout structure does it use? (grid? flex? centered? sidebar?)
2. What navigation pattern does it assume? (top nav? sidebar? hamburger? none?)
3. What content hierarchy does it enforce? (headline first? image first? CTA first?)
4. What interaction model does it assume? (click? scroll? hover? tap?)
5. What visual weight distribution does it use? (balanced? left-heavy? centered?)
6. What emotional tone does it set? (professional? playful? urgent? calm?)
7. What user journey does it assume? (linear? exploratory? goal-oriented?)

**Step 2b: Design the CONTRADICTION**

For each assumption, create one draft that does the **exact opposite**:
- If it uses grid → try freeform/overlapping
- If nav is top → try sidebar/bottom/hidden/none
- If headline is first → try image-first or CTA-first
- If it's click-based → try scroll-based or hover-based
- If balanced → try asymmetric
- If professional → try playful
- If linear journey → try exploratory

**This is not about what works.** This is about breaking the frame open. The contradiction might be useless — that's fine. It shakes the early answer loose.

---

### Phase 3: GLOBAL RESEARCH (Before Creating Alternatives)

**Research similar sections/pages globally** — not to copy, but to understand the design space.

**Where to research:**
- [Awwwards](https://www.awwwards.com/) — award-winning web design
- [Dribbble](https://dribbble.com/) — design concepts and trends
- [Mobbin](https://mobbin.com/) — real-world UI patterns by category
- [Page Flows](https://pageflows.com/) — user flow examples
- [Land-book](https://land-book.com/) — landing page examples
- [SaaS Landing Page Examples](https://saaslandingpage.com/) — SaaS-specific patterns
- [Godly](https://godly.website/) — website inspiration
- [Typewolf](https://typewolf.com/) — typography inspiration

**What to look for:**
- How do the best-in-class solve the same problem?
- What patterns are emerging in this category?
- What are the boring/expected approaches to avoid?
- What would delight a user who has seen the typical version?

**Do NOT copy.** Research to expand your design vocabulary, then create something original.

---

### Phase 4: CREATE ALTERNATIVES (Minimum 2, User Decides)

**Create at least 2 fundamentally different alternatives.** Not variations — alternatives.

**Alternative A: The Radical Departure**
- Completely different layout structure
- Different interaction model
- Different visual language
- Different content hierarchy
- Breaks at least 3 assumptions from Phase 2

**Alternative B: The Unexpected Angle**
- Approaches the problem from a different user perspective
- Uses a different emotional tone
- Employs a different visual metaphor
- Challenges what the section is "supposed to" look like

**Optional: Alternative C (if user wants more)**
- Push further into an extreme that Alternative A or B hinted at
- Explore a direction that feels "wrong" but might reveal something

**For each alternative, include:**
1. **Layout structure** — ASCII wireframe or detailed description
2. **Color system** — CSS custom properties
3. **Typography** — font choices, scale, hierarchy
4. **Interaction model** — how users engage with it
5. **Emotional tone** — what feeling it creates
6. **Why it works** — the reasoning behind the choices

**CRITICAL: Do NOT default to:**
- Moving the hero left/right
- Changing from grid to flex or vice versa
- Swapping primary/secondary colors
- Adding/removing border-radius
- Adjusting spacing by a few pixels
- These are variations, not alternatives

---

### Phase 5: USER SELECTION & REFINEMENT

**Present both alternatives** to the user with:
- Clear visual description (ASCII wireframe)
- Key differences from current design
- Why each approach works
- Trade-offs of each

**Ask the user:**
1. Which direction resonates? (or "neither — push further")
2. What elements from each should combine?
3. What emotional tone feels right?
4. Any constraints I should respect?

**Then refine** the selected direction — but stay true to its core idea. Do not drift back toward the current design during refinement.

---

## Anti-Fixation Rules (Mandatory)

### Rule 1: The 80% Rule
At least 80% of the redesigned section must be structurally different from the current version. If you're keeping more than 20% of the layout/structure, you're not redesigning — you're decorating.

### Rule 2: The Assumption Checklist
Before finalizing any alternative, verify it breaks at least 3 assumptions from Phase 2. If it doesn't, it's a variation, not an alternative.

### Rule 3: The "Would This Surprise?" Test
Ask yourself: "If the user saw this alternative next to the current design, would they be surprised?" If the answer is no, it's too close.

### Rule 4: The First Draft Ban
Do NOT present your first idea as the final alternative. Your first idea is always biased by the current design. Create at least 3 drafts internally, then present the one that differs most from the status quo.

### Rule 5: The "What If?" Questions
Before finalizing, answer these:
- What if there was no hero section at all?
- What if the CTA was the first thing users saw?
- What if there was no navigation?
- What if the page was just one big animation?
- What if users controlled the layout?
- What if this was a game, not a page?

**These questions are not suggestions.** They are mandatory thought experiments. Answer them, even if the answers are "that won't work." The act of considering them breaks fixation.

---

## What NOT to Do (Common Fixation Traps)

| Trap | Why It's Wrong | What to Do Instead |
|------|----------------|-------------------|
| Moving the hero left/right | Same layout, different position | Change the hero structure entirely |
| Changing colors slightly | Decoration, not redesign | Create a new color system |
| Swapping fonts | Surface-level change | Rethink the typographic hierarchy |
| Adjusting spacing | Polish, not redesign | Restructure the content flow |
| Adding/removing elements | Tinkering | Replace with different elements |
| Making it "cleaner" | Often means removing things | Add complexity in a different dimension |
| Following trends blindly | Copying, not designing | Research trends, then diverge |

---

## Output Format

### For Each Alternative:

```
## Alternative [A/B/C]: [Name]

### Concept
[1-2 sentence description of the core idea]

### Layout Structure
[ASCII wireframe or detailed component tree]

### Color System
:root {
  --color-primary: #...;
  --color-secondary: #...;
  /* etc */
}

### Typography
- Headings: [font, weight, scale]
- Body: [font, weight, scale]

### Interaction Model
[How users engage with this design]

### Emotional Tone
[What feeling this creates]

### What's Different From Current
1. [Major structural change 1]
2. [Major structural change 2]
3. [Major structural change 3]

### Why This Works
[Reasoning grounded in design principles]
```

### For User Presentation:

```
## Redesign Alternatives

I've created [2/3] fundamentally different directions for [section/page].

**Current Design Assumptions I Broke:**
1. [Assumption 1]
2. [Assumption 2]
3. [Assumption 3]

### Alternative A: [Name]
[Description + key visual]

### Alternative B: [Name]
[Description + key visual]

[Optional: Alternative C]

**Which direction resonates?** Or should I push further in a different direction?
```

---

## Integration With Other Skills

After the user selects an alternative:

1. **Load `design-basics`** — Apply color theory, typography, spacing fundamentals
2. **Load `premium-design`** — Apply premium polish to the selected direction
3. **Load `ui-checklist`** — Verify completeness and accessibility
4. **Load `design-taste-frontend`** — Set the Three Dials (VARIANCE/MOTION/DENSITY)

**Do NOT load these skills before Phase 4.** They will bias you toward the current design's patterns. First create the alternative, then polish it.

---

## Example: Redesigning a Hero Section

**Current design:** Centered headline, subtext below, CTA button, background image.

**Assumption breaking:**
1. Layout: centered → asymmetric, overlapping, full-bleed, or no hero at all
2. Content: headline-first → image-first, CTA-first, or testimonial-first
3. Interaction: static → scroll-driven, hover-based, or video-based
4. Structure: single section → multi-part narrative or progressive disclosure

**Alternative A: The Narrative Hero**
- Full-bleed video background
- Headline appears word-by-word as user scrolls
- CTA is a floating element that follows the scroll
- No traditional "hero" — it's a story that unfolds

**Alternative B: The Product-First Hero**
- Product screenshot takes 70% of viewport
- Headline is overlaid on the product
- CTA is embedded in the product (like a button within the UI)
- Social proof is the hero, not the brand message

**These are not variations.** They are fundamentally different approaches to the same problem.

---

## The Bottom Line

A redesign is not making things look different. A redesign is rethinking the problem from a new angle.

If you find yourself protecting the current design, you're in fixation mode. Stop. Go back to Phase 2. Break more assumptions. Research more examples. Create something that would surprise the user.

**Your second answer usually shows up only after you stop protecting the earlier one.**
