> Source: [UI Design Principles](https://www.figma.com/resource-library/ui-design-principles/) · [Responsive Website Design](https://www.figma.com/resource-library/responsive-website-design/)

# Layout & Spacing for Premium Web Design

## Quick Reference

| Spacing | Use |
|---------|-----|
| **4px** | Icons inside buttons, tight badge padding |
| **8px** | Button label-to-icon gap, small card padding |
| **12px** | Half-step for tight spacing |
| **16px** | Card padding, form field padding, content padding |
| **24px** | Section padding, modal padding, medium spacing |
| **32px** | Large card padding, grid gaps |
| **48px** | Section margins, hero padding |
| **64px+** | Large section separations, page margins |

### Content Max Widths
| Context | Max Width |
|---------|-----------|
| Text content (long-form) | **680-720px** |
| Standard content | **960px** |
| Wide content (cards, grids) | **1200px** |
| Full-bleed hero | **1440px** |
| Dashboard / app layout | **100%** |

### Section Padding
| Viewport | Padding |
|----------|---------|
| Mobile (0-639px) | **2rem** (32px) |
| Tablet (640-1023px) | **3rem** (48px) |
| Desktop (1024px+) | **5rem** (80px) |

## The 8px Grid System

Use multiples of 8px for all spacing, sizing, and positioning:
```
--space-1:  4px   (half-step, exceptions only)
--space-2:  8px
--space-3:  12px  (half-step for tight spacing)
--space-4:  16px
--space-5:  20px  (half-step)
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-14: 56px
--space-16: 64px
--space-20: 80px
--space-24: 96px
--space-32: 128px
--space-40: 160px
```

### When to use each
- **4px**: Icons inside buttons, tight badge padding
- **8px**: Button padding, small card padding
- **16px**: Card padding, form field padding, content padding
- **24px**: Section padding, modal padding, medium spacing
- **32px**: Large card padding, gutters
- **48px**: Section margins, hero padding
- **64px+**: Large section separations, page margins

## CSS Logical Properties (Modern Approach)

Always prefer logical properties over physical ones for internationalization:

```css
/* Instead of: */
margin-left: 2rem;
padding-right: 1rem;
border-left: 2px solid;

/* Use: */
margin-inline-start: 2rem;
padding-inline-end: 1rem;
border-inline-start: 2px solid;

/* Common shorthand */
.element {
  margin-inline: auto;      /* margin-left + margin-right */
  padding-block: 2rem;      /* padding-top + padding-bottom */
  padding-inline: 1.5rem;   /* padding-left + padding-right */
  inset-inline: 0;          /* left + right */
}
```

## Layout Patterns for Premium Design

### Centered (most common for landing pages)
```css
.container {
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: clamp(1rem, 5vw, 2rem);
}
```
Best for: Content-focused sites, product pages, blogs

### Full-bleed sections with content containers
```html
<section class="full-bleed">
  <div class="container">
    <!-- content constrained to 1200px -->
  </div>
</section>
```

```css
.full-bleed {
  width: 100vw;
  margin-inline: calc(-50vw + 50%);
  padding-inline: clamp(1rem, 5vw, 2rem);
}
```

### Asymmetric (bold / editorial)
- Hero: text on left, image right (60/40 split)
- Feature: alternate sides every other row
- Use CSS Grid: `grid-template-columns: 3fr 2fr` or `2fr 3fr`

```css
.asymmetric-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 4rem;
  align-items: center;
}

.feature-row:nth-child(even) .asymmetric-grid {
  grid-template-columns: 2fr 3fr;
  direction: rtl; /* Swaps visual order */
}
.feature-row:nth-child(even) .asymmetric-grid > * {
  direction: ltr; /* Restores text direction */
}
```

### Split-screen
- Perfect for landing page heros
- 50/50 or 60/40 split
- Left: value prop + CTA, Right: image/illustration/demo

```css
.split-screen {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 80vh;
}

.split-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem;
}

.split-visual {
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .split-screen {
    grid-template-columns: 1fr;
  }
  .split-visual {
    min-height: 40vh;
    order: -1;
  }
}
```

### Holy Grail Layout (App/SaaS)
```css
.app-layout {
  display: grid;
  grid-template-areas:
    "sidebar header"
    "sidebar main"
    "sidebar aside";
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.app-header  { grid-area: header; }
.app-sidebar { grid-area: sidebar; }
.app-main    { grid-area: main; }
.app-aside   { grid-area: aside; }
```

## Content Widths (Desktop)

| Context | Max Width |
|---|---|
| Text content (long-form) | 680-720px |
| Standard content | 960px |
| Wide content (cards, grids) | 1200px |
| Full-bleed hero | 1440px |
| Dashboard / app layout | 100% |

## Margin & Padding Conventions

### Section spacing
```css
/* Desktop */
section { padding-block: 5rem; }
/* Tablet */
@media (max-width: 768px) { section { padding-block: 3rem; } }
/* Mobile */
@media (max-width: 480px) { section { padding-block: 2rem; } }
```

### Vertical rhythm
```css
h1 + p   { margin-top: 1.5rem; }  /* heading to body */
h2 + p   { margin-top: 1rem; }
p + p    { margin-top: 1.5rem; }  /* paragraph spacing */
p + h2   { margin-top: 3rem; }    /* section break */
* + h2   { margin-top: 4rem; }    /* after any element */
```

### Card padding
```css
.card { padding: clamp(1rem, 3vw, 2rem); }
```

## Responsive Breakpoints

```css
/* Mobile first */
/* Base: 0-639px (mobile) */
@media (min-width: 640px) { /* tablet */ }
@media (min-width: 1024px) { /* desktop */ }
@media (min-width: 1280px) { /* wide */ }
```

## CSS Container Queries (Modern)

```css
/* Component-level responsiveness */
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 1rem;
  }
}

@container (min-width: 600px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Usage */
.card-container {
  container-type: inline-size;
  container-name: card;
}
```

## CSS Grid Advanced Patterns

### Auto-fill responsive grid
```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

### Subgrid for aligned content
```css
.parent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.child-grid {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3; /* Aligns children across cards */
}
```

### Named grid areas
```css
.page-layout {
  display: grid;
  grid-template-columns: 1fr min(1200px, 100%) 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    ". header ."
    ". main ."
    ". footer .";
}

.page-layout > header { grid-area: header; }
.page-layout > main  { grid-area: main; }
.page-layout > footer { grid-area: footer; }
```

## The Proximity Principle
Things that belong together should stay together. Users naturally perceive elements close together as related:

- Group related form fields with fieldset/legend
- Place labels close to their inputs (closer than to the next field)
- Use spacing to create visual groups (8px gap for related, 24px for unrelated)
- Place CTAs near the content they act on
- Social proof near CTAs (where doubt is highest)

## Responsive Layout Framework Comparison
| Approach | Code | Use Case |
|---|---|---|
| CSS Grid | `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))` | Page layouts, card grids |
| Flexbox | `display: flex; flex-wrap: wrap; gap: 16px;` | Components, navigation, centering |
| Fluid | `max-width: 1200px; padding-inline: clamp(1rem, 5vw, 2rem)` | Content containers |
| Container Queries | `@container (min-width: 400px) { ... }` | Component-level responsiveness |

## Gap vs Margin Decision Guide

```css
/* Use gap (flex/grid) when elements are in a container */
.card-grid { display: grid; gap: 1.5rem; }
.nav-links { display: flex; gap: 2rem; }

/* Use margin when elements are in flow */
h2 { margin-top: 3rem; }
p { margin-bottom: 1.5rem; }

/* Never use margin on grid/flex children — use gap instead */
```

## Premium Layout Techniques

### Z-pattern for landing pages
Eyes scan left-to-right, top-to-bottom in a Z shape. Place:
- Top-left: logo
- Top-right: navigation / primary CTA
- Center: value proposition
- Bottom-right: secondary CTA

### F-pattern for content-heavy pages
Eyes scan left-to-right across the top, then down the left edge. Optimize:
- Headlines left-aligned (not centered)
- Bold lead paragraphs
- Bullet points and short scannable chunks

### Visual hierarchy rules
1. **Size** wins: the biggest element gets attention first
2. **Color** second: high-contrast or accent-colored elements draw the eye
3. **Spacing** third: isolated elements (more whitespace around them) feel more important
4. The hero headline and primary CTA must be the most visually dominant elements on the page

## Mobile-first spacing
```css
/* Mobile: tighter */
section { padding: 2rem 1rem; }
/* Tablet */
@media (min-width: 640px) { section { padding: 3rem 1.5rem; } }
/* Desktop */
@media (min-width: 1024px) { section { padding: 5rem 2rem; } }
```

## Cross-References
- See [responsive-design.md](./responsive-design.md) for framework details and breakpoints
- See [design-tokens.md](./design-tokens.md) for spacing token definitions
- See [typography.md](./typography.md) for vertical rhythm in text
- See [landing-pages.md](./landing-pages.md) for section layout patterns
- See [ui-components.md](./ui-components.md) for component-specific spacing
- See [design-principles.md](./design-principles.md) for proximity and hierarchy rules
