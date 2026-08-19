# AI Design Workflows — AI Ke Saath Kaam Karna

> Source: Figma "Vibe Coding Examples", "AI Website Examples", "AI Tools & Workflows", "AI for Product Managers"

## How AI Changes Design Workflow

- **68% of developers use AI to generate code** (Figma AI Report 2025)
- **34% of designers shipped AI product in 2025** (up from 22%)
- **85% of designers say AI will be essential to future success**
- **78% say AI speeds up workflows**
- **85% save ~4 hours/week via GenAI** (Canva 2025)

## The 4-Step AI Design Workflow

### Step 1: Map Logic (FigJam)
Pehle plan karo, phir prompt karo:
- User flows flowchart
- Data flow / database schema
- Screen transitions
- Define rules and constraints
- **Don't start prompting without a plan** — saves back-and-forth

### Step 2: Create Visual Source of Truth (Figma Design)
AI ko reference do:
- Brand colors, typography, button styles
- 2-3 key screens designed manually
- Component library / design system
- **AI needs to know your brand** — don't expect it to guess

### Step 3: Prompt & Prototype (Figma Make)
AI ko specific instructions do:
- Exact components needed
- Logic details ("When user clicks X, show Y")
- Interaction patterns
- Then iterate: tune prompts, adjust variables

### Step 4: Refine & Deploy
- Review AI output carefully — **94% of designers still review AI outputs for brand safety**
- Adjust layout, colors, spacing
- Add missing states and edge cases
- Deploy via Figma Sites, or export code to Cursor/Replit

## Prompt Engineering for Design

### Bad Prompt:
> "Create a landing page for my startup"

### Good Prompt:
> "Create a landing page for a SaaS startup that offers CRM, CMS, and AI agents. Dark mode design. Color palette: deep navy (#0a1929) as background, teal (#00bfa5) as accent, white text. Inter font for headings, system sans for body. Features section with 3 bento grid cards. Hero with headline: 'Your All-in-One Business OS'. CTA: 'Start Free Trial'. Include a social proof bar with logo placeholders."

## AI Design Tools for Your Workflow

### For Your Startup, Use These:

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Figma Make** | Prompt to prototype | Starting new designs, rapid iteration |
| **Figma Design** | Refinement, polish | After AI generates initial layout |
| **Figma Sites** | Deploy responsive site | Final design → live website |
| **Dev Mode** | Developer handoff | When handing to engineering team |
| **FigJam** | Planning, flows, brainstorming | Before any design work |
| **ChatGPT/Claude** | Brainstorming, copywriting | Writing headlines, value props |

## AI-Generated Designs — What to Watch Out For

### AI is Good At:
- Generating layout variations quickly
- Creating consistent mock data
- Auto-populating grids and tables
- Following prompt constraints
- Generating production-ready code (HTML/CSS/React)

### AI is Bad At:
- ❌ Brand-specific design (needs reference)
- ❌ Edge cases and error states (needs manual addition)
- ❌ Perfect pixel spacing (needs refinement)
- ❌ Accessibility checks (often fails contrast)
- ❌ Understanding business context
- ❌ Consistent visual hierarchy

### Always Review AI Outputs For:
1. Color contrast (WCAG AA pass?)
2. Spacing consistency (8px grid?)
3. Typography hierarchy (clear H1 → H2 → Body?)
4. Touch targets (44px+?)
5. Missing states (empty, error, loading)
6. Alignment (everything lined up?)
7. Brand alignment (looks like your brand?)

## Figma Make Tips

- **Write detailed prompts** — include exact components, colors, logic
- **Point and edit** — click any element to change color/font
- **Copy existing frames** from Figma Design to give AI a head start
- **Iterate** — generate → review → reprompt → refine
- **Test all interactions** — click every button, trigger every state
- **Don't ship AI output as-is** — always polish in Figma Design

## The Future: AI + Designer Collaboration

- AI handles **mechanical layout work** (8px grid math, auto-populating data)
- Designers focus on **brand, strategy, and creative direction**
- Prototypes replacing PRDs as source of truth
- AI-generated designs = starting point, not finishing point
- Your role = art director + quality control + strategic decisions
