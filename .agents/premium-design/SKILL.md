---
name: premium-design
description: >
  Premium UI/UX design skill for web interfaces. Applies professional design principles
  — typography, color theory, layout systems, design tokens, interaction patterns —
  distilled from 67+ Figma Resource Library articles across 9 categories.
trigger: >
  User asks for visual design, UI polish, "make this look premium/professional/aesthetic",
  design critique/audit, color/font selection, design system creation, layout improvements,
  component styling, landing/pricing/portfolio page design, dark mode, glassmorphism,
  responsive/mobile-first design, micro-interactions, animation, visual hierarchy,
  spacing/rhythm, or any design-related task.
avoid_trigger: >
  Pure functionality questions (no visual component), backend/code logic questions,
  data structure discussions, algorithm problems, API design, database schema,
  performance optimization (unless paired with a design concern),
  security hardening, testing strategy, or DevOps/infrastructure.
---

# Premium Design Skill

This skill produces **production-ready, premium-quality web interfaces**. It bundles distilled knowledge from the Figma Resource Library covering typography, color theory, layout systems, UI components, design tokens, and interaction patterns. Output is always in working code (CSS, Tailwind, styled-components, or inline styles as appropriate for the user's stack).

---

## How to Use This Skill

### Trigger Rules

**Trigger when** the user's request mentions any of:
- Visual design, UI polish, "make this look premium/professional/aesthetic/better/cool/modern"
- Color palettes, fonts, typography, spacing, layout, grid
- Component styling (buttons, cards, forms, modals, navbars)
- Design systems, design tokens, theming
- Dark mode, glassmorphism, neumorphism, gradients, shadows
- Landing pages, pricing pages, portfolio pages, hero sections
- Micro-interactions, animations, transitions, hover effects
- Responsive design, mobile-first, breakpoints
- Design critique, UI audit, visual hierarchy
- Prototypes, mockups, wireframes, design feedback
- Terms: "aesthetic", "polish", "pixel-perfect", "make it pop", "clean up the UI"

**DO NOT trigger** when the user is asking about:
- Pure backend logic, API routes, database schemas, server configuration
- Algorithms, data structures, coding challenges
- DevOps, CI/CD, Docker, deployment pipelines
- Security hardening, authentication flows (unless UI-related)
- Testing strategy, unit tests, integration tests (unless paired with visual concern)
- Command-line tools, terminal UIs
- The user is merely discussing design philosophy without requesting implementation

### Workflow

When triggered, follow these steps **in order**:

1. **CLARIFY** — Ask which design mode they want (Modern Minimalist, Bold & Expressive, Luxury/High-End) OR infer from context. If the user already specified a mode, skip this step.

2. **PROBE CONSTRAINTS** — Before writing code, ask or infer:
   - "Do you have a budget for fonts/icons/assets?" (free vs paid)
   - "Any accessibility requirements?" (WCAG AA/AAA)
   - "Performance constraints?" (page weight, animation budget)
   - "Target device/audience?"
   - "Existing brand colors or starting from scratch?"
   Only ask what is not already clear from context.

3. **CONSULT** — Reference the relevant files from the Topic Structure table below for the specific design dimension being worked on.

4. **GENERATE** — Produce working code. Always include: HTML structure + CSS (or framework equivalent). Never describe design abstractly — always output concrete, copy-pasteable code.

5. **EXPLAIN** — For each major decision, give a 1-sentence rationale prefixed with `// WHY:`. Example: `// WHY: 8px scale ensures vertical rhythm consistency across breakpoints`

6. **CHECKLIST** — Run the Universal Premium Design Checklist against your output before delivering.

---

## Design Philosophy

**Directive**: Every choice you make must be intentional. Before outputting any CSS value, verify it serves a purpose. A premium feel comes from:
- **Consistency** — Same spacing, color, type treatment for the same thing everywhere
- **Restraint** — Fewer colors, fewer typefaces, fewer effects. Remove anything that does not earn its place
- **Micro-details** — Focus rings, hover transitions, disabled states, loading states, edge alignment
- **Whitespace** — Crowded UI never feels premium. When in doubt, add padding

---

## Design Modes — Concrete Implementation Guidance

### Mode 1: Modern Minimalist
*Reference: Stripe, Linear, Apple, Notion*

**When to use**: SaaS dashboards, productivity tools, developer tools, content sites, B2B apps.

**Layout rules**:
- Max content width: `min(1200px, 100% - 48px)` with horizontal auto margins
- Padding: minimum `24px` on mobile, `48px` on desktop for section padding
- Grid gaps: `24px` minimum between content buckets
- Use a single column on mobile, 2-3 columns on `>=768px`

<example>
```css
/* MODERN MINIMALIST — Core Layout */
.premium-section {
  max-width: min(1200px, 100% - 3rem);
  margin-inline: auto;
  padding: clamp(2rem, 5vw, 4rem) 0;
}
.premium-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
  gap: clamp(1.5rem, 3vw, 2.5rem);
}
```
</example>

**Color system**:
- Neutral base: `#ffffff`, `#f9fafb`, `#f3f4f6` (background layers)
- Neutral text: `#111827` (headings), `#4b5563` (body), `#9ca3af` (secondary)
- Single accent: one saturated color used **only** for CTAs, links, active states
- Error/success: use at 10% opacity for backgrounds, full opacity for icons/text

<example>
```css
/* MODERN MINIMALIST — Color Tokens */
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  --color-text-heading: #111827;
  --color-text-body: #4b5563;
  --color-text-muted: #9ca3af;
  --color-accent: #6366f1;        /* single accent — indigo */
  --color-accent-hover: #4f46e5;
  --color-error: #ef4444;
  --color-success: #22c55e;
  --border-color: #e5e7eb;
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
}
```
</example>

**Typography**:
- Single sans-serif family: `Inter` or `SF Pro Text` (avoid system font stacks for premium feel)
- Weight contrast: `700` for headings, `500` for subheadings, `400` for body
- Scale: `clamp(1.75rem, 4vw, 3rem)` for h1, `1.25rem` for h2, `1rem` for body
- Line height: `1.2` headings, `1.6` body

**Effects rules**:
- Shadows: `0 1px 2px rgba(0,0,0,0.05)` (subtle), never use spread
- Borders: `1px solid` at `#e5e7eb` or lighter, use borders sparingly
- Gradients: DO NOT use
- Border-radius: `6-12px` for cards, `9999px` only for pills/avatars

**Motion rules**:
- Duration: `150ms` for micro-interactions, `200ms` for transitions
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard ease)
- Properties: only `opacity` and `transform` — never `width`, `height`, `top`, `left`
- No scroll-triggered animations, no parallax, no staggered reveals

<example>
```css
/* MODERN MINIMALIST — Button with all states */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  color: #ffffff;
  background: var(--color-accent);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1),
              transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-primary:hover {
  background: var(--color-accent-hover);
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}
.btn-primary:active {
  transform: scale(0.97);
}
.btn-primary:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```
</example>

---

### Mode 2: Bold & Expressive
*Reference: Vercel, Awwwards winners, Stripe Press, Brunello Cucinelli*

**When to use**: Marketing sites, product launch pages, creative portfolios, event pages, brand storytelling.

**Layout rules**:
- Asymmetric grids using explicit column placement (not auto-fill)
- Overlapping elements with negative margins or `position: relative; z-index`
- Full-bleed sections using `width: 100vw; margin-left: calc(-50vw + 50%)`
- Breaking the grid intentionally — let elements extend beyond their column

<example>
```css
/* BOLD & EXPRESSIVE — Asymmetric Layout */
.bold-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-height: 90vh;
  align-items: center;
}
.bold-hero-content {
  padding: 4rem;
  position: relative;
  z-index: 2;
}
.bold-hero-visual {
  grid-column: 2 / 3;
  margin: -2rem -4rem -2rem 0; /* intentional overflow */
}
@media (max-width: 768px) {
  .bold-hero {
    grid-template-columns: 1fr;
  }
  .bold-hero-visual {
    grid-row: 1 / 2;
    margin: 0;
  }
}
```
</example>

**Color system**:
- Vibrant gradients as brand anchors: `linear-gradient(135deg, #... 0%, #... 100%)`
- High contrast: pair saturated hues with near-black (`#0a0a0a`) or pure white
- Accent pairs: use complementary or triadic color schemes (e.g. purple + cyan + pink)
- Dark mode variant: invert the gradient direction and reduce saturation by 20%

<example>
```css
/* BOLD & EXPRESSIVE — Color Tokens */
:root {
  --gradient-hero: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f59e0b 100%);
  --gradient-card: linear-gradient(145deg, #1e1b4b 0%, #312e81 100%);
  --color-text-on-gradient: #ffffff;
  --color-bg-dark: #0a0a0a;
  --color-accent-primary: #7c3aed;
  --color-accent-secondary: #ec4899;
  --color-accent-tertiary: #f59e0b;
  --color-surface: #1a1a2e;
  --color-text-heading: #f1f5f9;
  --color-text-body: #94a3b8;
  --glow-primary: 0 0 40px rgba(124, 58, 237, 0.3);
}
```
</example>

**Typography**:
- Display typeface: variable font with weight axis (`wght` 700-900) for headings
- Body: clean sans-serif (`Inter` or `DM Sans`) at `400` weight
- Size: `clamp(3rem, 8vw, 8rem)` for hero headings, `clamp(1.5rem, 4vw, 3rem)` for section headings
- Letterspacing: `-0.02em` for large headings, `0.01em` for uppercase labels
- Line height: `1.0` for display headings, `1.5` for body

**Effects rules**:
- Glassmorphism: `backdrop-filter: blur(20px)` with `rgba(255,255,255,0.05)` background
- Glow: use `box-shadow` with large blur radius and the accent color at 15-30% opacity
- Grain texture: CSS-only with repeating pseudo-element or a background SVG noise
- Animated gradient backgrounds using `background-size: 200% 200%; animation: shift 8s ease infinite`
- DO NOT overuse — limit glassmorphism to 1-2 elements per page

<example>
```css
/* BOLD & EXPRESSIVE — Glassmorphism Card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
}

/* BOLD & EXPRESSIVE — Animated Gradient Background */
.gradient-bg {
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```
</example>

**Motion rules**:
- Scroll-triggered: use `IntersectionObserver` with `threshold: 0.1` for reveal animations
- Staggered children: apply `transition-delay: calc(var(--index) * 100ms)` to list items
- Parallax: subtle only — max `translateY(30px)` on scroll, use `will-change: transform`
- Duration: `400-800ms` for reveals, `200-300ms` for micro-interactions
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for dramatic entrances

<example>
```css
/* BOLD & EXPRESSIVE — Staggered Reveal */
.reveal-group > * {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal-group.visible > * {
  opacity: 1;
  transform: translateY(0);
}
.reveal-group > *:nth-child(1) { transition-delay: 0ms; }
.reveal-group > *:nth-child(2) { transition-delay: 100ms; }
.reveal-group > *:nth-child(3) { transition-delay: 200ms; }
.reveal-group > *:nth-child(4) { transition-delay: 300ms; }
.reveal-group > *:nth-child(5) { transition-delay: 400ms; }
.reveal-group > *:nth-child(6) { transition-delay: 500ms; }
```
</example>

---

### Mode 3: Luxury / High-End
*Reference: Balenciaga, Bottega Veneta, Porsche, Aman Resorts*

**When to use**: Fashion/beauty brands, luxury goods, premium services, high-end real estate, fine dining, exclusive membership sites.

**Layout rules**:
- Centered hero with `text-align: center` and generous `max-width: 640px`
- Full-width imagery that bleeds edge-to-edge with `object-fit: cover` and `height: 60vh` minimum
- Generous margins: `80px` minimum between sections, `120px` for major breaks
- Asymmetry only when it serves the narrative — prefer symmetrical balance
- Footer: minimal, centered, uppercase tracking on all text

<example>
```html
<!-- LUXURY — Hero Section Structure -->
<header class="luxury-hero">
  <nav class="luxury-nav">
    <a href="/" class="luxury-logo">MAISON</a>
    <div class="luxury-nav-links">
      <a href="#">Collections</a>
      <a href="#">Journal</a>
      <a href="#">Boutiques</a>
      <a href="#">Enquiries</a>
    </div>
  </nav>
  <div class="luxury-hero-content">
    <p class="luxury-superscript">Autumn-Winter 2026</p>
    <h1 class="luxury-heading">The Art of <br/>Refined Living</h1>
    <p class="luxury-subheading">Discover our latest collection, crafted with exceptional materials</p>
    <a href="#" class="luxury-cta">Explore the Collection</a>
  </div>
  <div class="luxury-hero-image">
    <img src="hero.jpg" alt="" loading="eager" />
  </div>
</header>
```
</example>

**Color system**:
- Background: `#0a0a0a` (deep black), `#1a1a1a` (charcoal), `#2a2a2a` (surface)
- Text: `#f5f0eb` (cream off-white), `#d4cfc8` (warm gray), `#e8d5a3` (gold)
- Accent: gold (#c9a84c or #d4af37), amber (#bf7a3a), or champagne (#e8d5a3)
- Restrict to 3 colors max: 2 neutrals + 1 metallic accent
- Gradient: only use gold-to-amber or cream-to-transparent, never multi-color gradients

<example>
```css
/* LUXURY — Color Tokens */
:root {
  --color-bg-primary: #0a0a0a;
  --color-bg-secondary: #1a1a1a;
  --color-bg-surface: #2a2a2a;
  --color-text-heading: #f5f0eb;
  --color-text-body: #d4cfc8;
  --color-text-muted: #8a8580;
  --color-accent-gold: #c9a84c;
  --color-accent-gold-hover: #d4be5e;
  --color-accent-gold-dim: rgba(201, 168, 76, 0.15);
  --color-border: rgba(245, 240, 235, 0.08);
  --color-border-accent: rgba(201, 168, 76, 0.3);
}
```
</example>

**Typography**:
- Headings: serif (`Playfair Display`, `Cormorant Garamond`, `Didot`) at weight `400-600`
- Body: refined sans-serif (`Neue Haas Grotesk`, `Inter Light`, `Jost`) at weight `300-400`
- Hero heading: `clamp(3rem, 6vw, 5.5rem)` with `letter-spacing: 0.02em`
- Body: `0.9375rem` with `letter-spacing: 0.01em` and `line-height: 1.8`
- Navigation: uppercase with `letter-spacing: 0.15em`, `font-size: 0.75rem`
- Pull quotes: italic or serif at `1.5rem` with generous top/bottom padding

<example>
```css
/* LUXURY — Base Typography */
.luxury-heading {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 500;
  font-size: clamp(3rem, 6vw, 5.5rem);
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--color-text-heading);
}
.luxury-body {
  font-family: 'Jost', 'Inter', system-ui, sans-serif;
  font-weight: 300;
  font-size: 0.9375rem;
  line-height: 1.8;
  letter-spacing: 0.01em;
  color: var(--color-text-body);
}
.luxury-nav-link {
  font-family: 'Jost', sans-serif;
  font-weight: 400;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 300ms ease-out;
}
.luxury-nav-link:hover {
  color: var(--color-text-heading);
}
```
</example>

**Effects rules**:
- Grain texture: subtle noise overlay at 5-10% opacity on hero backgrounds
- Hover: slow color transitions only (`300-400ms ease-out`), never scale/transform effects
- Images: always `grayscale(100%)` or desaturated by 40%, with `hover` to restore color
- Gold accent: use sparingly — borders (1px), underline decorations, icon fills only
- Dividers: thin horizontal rule at `rgba(245, 240, 235, 0.08)`, never use heavy borders

<example>
```css
/* LUXURY — Grain Texture Overlay */
.luxury-hero::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
  pointer-events: none;
}

/* LUXURY — Gold Accent Underline */
.luxury-cta {
  display: inline-block;
  font-family: 'Jost', sans-serif;
  font-weight: 400;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-accent-gold);
  text-decoration: none;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--color-accent-gold);
  transition: color 300ms ease-out, border-color 300ms ease-out;
}
.luxury-cta:hover {
  color: var(--color-text-heading);
  border-color: var(--color-text-heading);
}
```
</example>

**Motion rules**:
- Duration: `400-500ms` (slower = more luxurious feel)
- Easing: `cubic-bezier(0.25, 0.1, 0.25, 1)` or `ease-out` — never bouncy or spring
- Fade-in-up: `translateY(20px)` to `translateY(0)` and `opacity: 0` to `1`
- No parallax, no scroll-triggers beyond a single fade reveal
- Hover: only color/opacity transitions on interactive elements — no scale, no lift

---

## Universal Premium Design Checklist

Before delivering output, verify EVERY item. If any item fails, fix it before responding.

### Color & Contrast
- [ ] Text contrast ratio computed and verified against WCAG AA: body ≥ **4.5:1**, large text ≥ **3:1**
- [ ] Focus/active states have sufficient contrast from default (≥ 3:1 difference)
- [ ] Color is never the sole differentiator for interactive states (add icon, underline, or shape)
- [ ] Maximum **3 hues** in the palette (neutrals don't count), measured as distinct color wheel positions

### Typography
- [ ] Maximum **2 typeface families** (3 if counting a display/heading-specific face)
- [ ] Body text size is between **14-18px** (never smaller, never larger for reading)
- [ ] Line length is constrained to **60-75 characters** per line (use `max-width` on text containers)
- [ ] Headings use a **distinct weight** from body: at least 200-weight-unit difference (e.g., 700 vs 500)

### Layout & Spacing
- [ ] Consistent spacing scale used throughout: all margins/padding are multiples of the base unit (4px or 8px)
- [ ] Minimum section padding: **24px mobile / 48px desktop**
- [ ] Content width constrained: **max-width: min(72rem, 100% - 2rem)** on text-rich containers
- [ ] All interactive elements (`<a>`, `<button>`, `<input>`) have **minimum 44x44px touch target** (mobile)
- [ ] Visual hierarchy scan: scan page top-to-bottom. Can you identify the primary action in under 3 seconds?

### Interaction & Motion
- [ ] All interactive elements define: `:hover`, `:focus-visible`, `:active`, `:disabled` states
- [ ] Transition properties limited to `opacity` and `transform` (add `will-change` for GPU-accelerated properties)
- [ ] Duration is appropriate for mode: Modern Minimalist 150-200ms, Bold 200-600ms, Luxury 300-500ms
- [ ] `prefers-reduced-motion: reduce` respected — disable all non-essential animations
- [ ] No animation on initial page load unless specifically requested (prevent motion sickness)

### Accessibility
- [ ] All interactive elements are keyboard-focusable (native `<a>`/`<button>` or proper `tabindex`)
- [ ] `:focus-visible` ring defined as `outline: 2px solid <accent>; outline-offset: 2px`
- [ ] Images use meaningful `alt` text or `alt=""` for decorative images
- [ ] Color combinations accessible in both light and dark mode variants (if both supplied)

### Performance
- [ ] No `@import` in CSS — use `<link>` tags only
- [ ] No JS animations when CSS animations suffice
- [ ] Custom fonts use `font-display: swap` to prevent invisible text during load
- [ ] Animations use `transform` and `opacity` only (composited properties, avoids layout/paint thrashing)
- [ ] Glassmorphism/blur effects limited to small surfaces only, never full-screen

### Content
- [ ] No placeholder text, lorem ipsum, or generic dummy content — use realistic sample content
- [ ] All interactive text is action-oriented ("Get Started" not "Click Here", "Learn More" not "Read More")
- [ ] Empty/error/loading states considered for all dynamic content

---

## Handling User Constraints

When the user adds constraints, apply these overrides:

### Budget Constraints (user says "keep it free" or "no budget for assets")
- Use Google Fonts only (Inter, Jost, Playfair Display, DM Sans — all free)
- No custom icons — use Lucide, Heroicons (free) or simple Unicode/symbols
- No premium stock photos — use `picsum.photos` for placeholders, Unsplash for free real images
- SVG noise textures over image-based textures (free, no asset cost)

### Accessibility-First (user says "must be accessible" or "ADA compliant")
- Elevate all checklist accessibility items to hard requirements
- Minimum contrast: bump to **7:1** for body text (AAA)
- Focus indicators: use `outline: 3px solid` with `outline-offset: 3px` minimum
- Increase body font size floor to `16px`
- Ensure all interactive elements have accessible names (aria-label or visible text)
- Test with: keyboard-only navigation, 200% zoom, reduced motion

### Performance-Sensitive (user says "keep it fast", "lightweight", "Core Web Vitals")
- Zero JS animation libraries — use CSS animations and IntersectionObserver only
- No custom web fonts if default system fonts suffice (or subset to Latin-only)
- No glassmorphism/backdrop-filter (paints on the GPU and increases layer count)
- No gradients on large surfaces (use solid colors)
- Reduce or eliminate box-shadows
- No scroll-triggered anything
- Preferred mode: Modern Minimalist (least visual overhead)

### Mobile-First (user says "mobile first" or "responsive")
- Layout base: single column, `padding: 16px` on body
- Breakpoints only at: `480px` (large phone), `768px` (tablet), `1024px` (desktop)
- Text: never go below `14px` on mobile, prefer `16px`
- Touch targets: enforce `48x48px` minimum, `8px` gap minimum between tappable items
- Navigation: hamburger or bottom nav bar pattern

---

## Topic Structure — Reference Files

When the user's request maps to one of these topics, read the corresponding reference file and integrate its guidance into your output.

| When user asks about... | Action | Reference file |
|---|---|---|
| Color palettes, harmony, psychology, contrast | Generate CSS custom properties for the chosen mode's palette, then explain the rationale | `references/color-theory.md` |
| Fonts, pairings, sizing, variable fonts | Define a `font-family` stack, size scale with `clamp()`, and `@font-face` with `font-display: swap` | `references/typography.md` |
| Grids, spacing systems, responsive layout | Output a CSS grid with named template areas and a consistent spacing scale as custom properties | `references/layout-spacing.md` |
| Buttons, forms, cards, interactive elements | Generate HTML+CSS for each component with all interactive states defined | `references/ui-components.md` |
| Design tokens, naming conventions, theming | Output a complete `:root` / `data-theme="dark"` set of CSS custom properties following a `--category-property` naming convention | `references/design-tokens.md` |
| Design principles, UI vs UX, product design | Apply the principles directly in code — do not explain theory without also outputting code | `references/design-principles.md` |
| Landing pages, pricing pages, portfolio pages | Generate full HTML section structure (hero, features, pricing tiers, footer) with responsive layout | `references/landing-pages.md` |
| Current trends, dark mode, 3D, motion design | Implement the trend in code, with a `prefers-reduced-motion` fallback | `references/web-design-trends.md` |
| Interaction design, micro-interactions, states | Generate CSS transitions for hover/active/focus + JS IntersectionObserver for scroll-triggered interactions | `references/interaction-design.md` |
| Responsive design, mobile-first, breakpoints | Output mobile-first CSS with `min-width` breakpoints and a clear stacking strategy | `references/responsive-design.md` |

---

## Output Format Rules

- **Always output working code** — complete CSS with all states, complete HTML with semantic elements
- **Prefix design rationale** with `// WHY:` as inline CSS comments or adjacent HTML comments
- **Group generated CSS** by concern: Layout → Color → Typography → Effects → Motion
- **Use CSS custom properties** for all colors, spacing, fonts, and transitions — never use raw values
- **Mobile-first** CSS with `min-width` breakpoints (not `max-width` unless for specific exceptions)
- **Never use `!important`** — rely on specificity and source order
- **Always include `:focus-visible`** styles for every interactive element
- **Font imports** use `<link>` with `display=swap` or `@font-face` with `font-display: swap`

---

## Source Articles

This skill distills knowledge from 67+ Figma Resource Library articles across 9 categories. Key references:

### Color Theory
- [What is Color Theory?](https://www.figma.com/resource-library/what-is-color-theory/)
- [Color Combinations](https://www.figma.com/resource-library/color-combinations/)
- [Color Symbolism](https://www.figma.com/resource-library/color-symbolism/)
- [Types of Color Palettes](https://www.figma.com/resource-library/types-of-color-palettes/)

### Typography
- [Typography in Design](https://www.figma.com/resource-library/typography-in-design/)
- [Font Pairings](https://www.figma.com/resource-library/font-pairings/)
- [Best Fonts for Websites](https://www.figma.com/resource-library/best-fonts-for-websites/)

### UI Components & Interaction
- [Button States](https://www.figma.com/resource-library/button-states/)
- [Interaction Design](https://www.figma.com/resource-library/interaction-design/)
- [UI Design Principles](https://www.figma.com/resource-library/ui-design-principles/)

### Design Systems
- [Design Tokens](https://www.figma.com/resource-library/design-tokens/)
- [Design System Examples](https://www.figma.com/resource-library/design-system-examples/)
- [Design System Scaling](https://www.figma.com/resource-library/design-system-scaling/)

### Layout & Responsive
- [Responsive Website Design](https://www.figma.com/resource-library/responsive-website-design/)
- [Golden Ratio](https://www.figma.com/resource-library/golden-ratio/)

### Page Design
- [Landing Page Examples](https://www.figma.com/resource-library/landing-page-examples/)
- [Pricing Page Best Practices](https://www.figma.com/resource-library/pricing-page-best-practices/)
- [Portfolio Website Examples](https://www.figma.com/resource-library/portfolio-website-examples/)

### UX & Principles
- [What is UX Design?](https://www.figma.com/resource-library/what-is-ux-design/)
- [UI Design Principles](https://www.figma.com/resource-library/ui-design-principles/)
- [Design Thinking](https://www.figma.com/resource-library/what-is-design-thinking/)
- [UX Validation](https://www.figma.com/resource-library/ux-validation/)

### Trends
- [Web Design Trends 2026](https://www.figma.com/resource-library/web-design-trends/)
- [Fitts' Law](https://www.figma.com/resource-library/fitts-law/)

---

## Quick Start Scripts
- `scripts/generate-palette.js` — Generate CSS color palettes for any mode
- `assets/templates/premium-starter.html` — Premium HTML/CSS starter template
