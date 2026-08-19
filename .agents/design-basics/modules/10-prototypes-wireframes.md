# Prototypes & Wireframes — Bana Ke Dikhao

> Source: Figma "Prototype & Wireframe", "UX Validation", "No-Code App Examples"

## Wireframes vs Prototypes

| Wireframe | Low-Fi Prototype | High-Fi Prototype |
|-----------|-----------------|-------------------|
| Structure + layout | Basic interactivity | Full interactivity |
| No color, no images | Grey boxes + basic links | Real design + animations |
| Minutes to create | Hours to create | Days to create |
| For layout decisions | For flow validation | For user testing + dev handoff |
| Pen & paper or Figma | Figma basic prototyping | Figma interactive components |

## When to Use Which

### Low-Fidelity (Wireframes)
- **When:** Starting a new project, exploring layout options
- **Goal:** Validate information architecture, get stakeholder alignment
- **Time investment:** Minutes to 2 hours
- **Tools:** Figma basic shapes, paper sketches, FigJam

### Mid-Fidelity
- **When:** After wireframe approval, before visual design
- **Goal:** Test user flows, refine interactions
- **Time investment:** 2-8 hours
- **Tools:** Figma with auto layout, basic components

### High-Fidelity
- **When:** Final design validation, developer handoff
- **Goal:** User testing, stakeholder sign-off, production reference
- **Time investment:** Days to weeks
- **Tools:** Figma interactive components, Smart Animate, variables

## Wireframing Process for Your Startup

### Step 1: Screen Inventory (FigJam)
List all screens your startup needs:
```
Landing Page → Sign Up → Onboarding (3 steps) → Dashboard
CRM Module → CMS Module → AI Agents Module → Settings
Pricing Page → Checkout → Account → Support
```

### Step 2: User Flows (FigJam)
Map the path for each user action:
```
"Create an AI Agent"
Dashboard → Click "New Agent" → Select Template → Configure → Test → Deploy
```

### Step 3: Wireframes (Figma)
- Grey boxes, placeholder text
- 8px grid, auto layout
- Label each element (H1, Body, CTA, Image)
- Mobile version side-by-side

### Step 4: Prototype (Figma)
- Connect screens with interactions
- Add hover/active states
- Test all flows
- Share with stakeholders

### Step 5: Validate (User Testing)
- Watch users complete tasks
- Measure: task completion, error rate, time on task
- Iterate based on findings

## UX Validation Checklist

Before finalizing any design:

- [ ] User can complete primary task in <5 clicks
- [ ] Error rate < 5% for core flows
- [ ] Edge cases handled: empty states, error states, loading states
- [ ] All states designed: default, hover, active, disabled, loading, error
- [ ] Mobile flow completed on 360px screen
- [ ] Keyboard navigation works
- [ ] Screen reader can navigate
- [ ] No dead ends (every button leads somewhere)

## No-Code Prototyping

For your startup, Figma Make can accelerate prototype-to-product:

### 4-Step Vibe Coding Workflow
1. **FigJam** — Map logic (user flows, data flow, screen transitions)
2. **Figma Design** — Create visual source of truth (colors, typography, layout)
3. **Figma Make** — Prompt to functional prototype (working buttons, states, logic)
4. **Deploy** — Figma Sites for web, Dev Mode for developer handoff

### What Figma Make Can Prototype:
- Games with complex logic (physics, collisions)
- Interactive dashboards (filters, drill-downs, real-time data)
- E-commerce (cart, checkout flow, product filters)
- Mobile apps (navigation, forms, gestures)
- AI interfaces (chat, agent configuration, image generation)

## Common Mistakes

1. ❌ Skipping wireframes — directly jumping to visual design
2. ❌ Making prototypes too complex too early
3. ❌ Not testing with real users
4. ❌ Dead-end prototypes (buttons go nowhere)
5. ❌ Only designing happy path — skip error/edge cases
6. ❌ Ignoring mobile in wireframes

## Figma Tips

- **Interactive components** — ek component mein multiple states
- **Smart Animate** — morphing animations between screens
- **Overlays** — modals, tooltips, dropdowns in prototype
- **Variables** — conditional logic in prototypes (Figma advanced)
- **Dev Mode** — CSS, specs, assets ready for developers
- **Community templates** — wireframe kits to start faster
