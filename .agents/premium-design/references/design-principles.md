> Source: [What is UX Design?](https://www.figma.com/resource-library/what-is-ux-design/) · [UI Design Principles](https://www.figma.com/resource-library/ui-design-principles/) · [Design Thinking](https://www.figma.com/resource-library/what-is-design-thinking/)

# Design Principles for Premium Web Design

## Quick Reference

| Principle | Application |
|-----------|-------------|
| Visual hierarchy | Size > Color > Spacing (largest/hearest = most important) |
| Hick's Law | Max 5-7 nav items, 3-4 pricing tiers, essential form fields |
| Fitts's Law | Primary CTA = largest + closest, min 44x44px target |
| Miller's Law | Chunk info into groups of 5-9 items |
| Jakob's Law | Use familiar patterns (logo top-left, cart top-right) |
| Progressive disclosure | Reveal steps gradually, show progress |
| Proximity | 8px gap for related content, 24px+ for unrelated |
| Consistency | 1 design system, 1 button style = 1 action type |

## The 7 Questions of Successful UX (Peter Morville)
A design is successful when it answers YES to:
- **Useful?** — solves a real problem
- **Usable?** — easy to accomplish tasks
- **Desirable?** — evokes positive emotion
- **Findable?** — navigation is intuitive
- **Accessible?** — usable by everyone regardless of ability
- **Credible?** — trustworthy appearance and content
- **Valuable?** — delivers measurable value to users and business

## The 5 Pillars of UI Design
1. **Page layout** — grid systems, spacing, visual hierarchy
2. **Color scheme & font selection** — palettes, typography pairings
3. **Interactive elements** — buttons, forms, navigation, micro-interactions
4. **Wireframe & prototype fidelity** — from low-fi sketches to high-fi interactive
5. **Consistency** — same patterns everywhere

## 7 UI Design Principles

### 1. Hierarchy
Guide user attention via font size, contrast, and spacing. The most important information should be the most visually dominant.

```css
/* Clear visual hierarchy */
.hero-title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  margin-top: 1rem;
}

.hero-cta {
  margin-top: 2rem;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  background: var(--color-action-primary);
}
```

### 2. Progressive Disclosure
Reveal information step-by-step to avoid overwhelming users. Break complex forms/processes into manageable steps with clear progress indicators.

```html
<nav aria-label="Progress">
  <ol class="progress-steps">
    <li class="active" aria-current="step">Account</li>
    <li>Profile</li>
    <li>Billing</li>
    <li>Confirm</li>
  </ol>
</nav>
```

```css
.progress-steps {
  display: flex;
  gap: 0;
  counter-reset: step;
}
.progress-steps li {
  flex: 1;
  text-align: center;
  padding: 0.75rem;
  color: var(--color-text-secondary);
  border-bottom: 2px solid var(--color-border-default);
  counter-increment: step;
}
.progress-steps li::before {
  content: counter(step);
  display: block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  border-radius: 50%;
  background: var(--color-border-default);
  color: #fff;
  margin: 0 auto 0.5rem;
}
.progress-steps li.active::before {
  background: var(--color-action-primary);
}
```

### 3. Consistency
Use design systems so patterns repeat predictably. Same button style = same action type throughout the product.

```css
/* One pattern for all primary buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-action-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 150ms ease, transform 150ms ease;
}
```

### 4. Contrast
High-contrast elements command attention. Use strategically for critical actions (delete button in red, primary CTA in brand color).

```css
/* Contrast hierarchy for buttons */
.btn-primary {
  background: var(--color-action-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(79,70,229,0.3);
}
.btn-secondary {
  background: transparent;
  color: var(--color-action-primary);
  border: 2px solid var(--color-action-primary);
}
.btn-danger {
  background: #DC2626;
  color: #fff;
}
```

### 5. Accessibility
Follow WCAG: 4.5:1 contrast, alt text, keyboard navigation, focus indicators, semantic HTML. See [accessibility.md](./accessibility.md).

### 6. Proximity
Group related elements together spatially. Streaming apps group play controls together; quit button lives separately.

```css
/* Proximity via spacing tokens */
.form-group {
  margin-bottom: 1.5rem; /* 24px between groups */
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem; /* 8px from label to input */
}
.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
}
.form-group + .form-group {
  margin-top: 0; /* Using parent spacing instead */
}
```

### 7. Alignment
Clean lines, strong grid system. Consistent alignment improves readability and creates predictability.

```css
/* Consistent alignment */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
.card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  /* All cards share same internal alignment */
}
.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
```

## Consistency vs. Coherence
- **Consistency**: The same UI patterns are used throughout (same button style, same spacing, same interaction patterns)
- **Coherence**: The pieces feel connected and reflect the same underlying values
- "The difference between a product that works and one that feels like it was meant to exist."

## Functionality Over Polish
"Pretty design on top of broken interactions is just a more attractive problem."
- Validate interactions before polishing visuals
- A broken animation is worse than no animation
- Loading, error, and empty states matter as much as the ideal state

## The Product Design Process (5 Steps)
1. **Set Goals** — SMART goals so everyone defines success the same way
2. **Research** — SWOT analysis, customer journey maps, user interviews
3. **Analyze** — Distill findings: (a) core problem, (b) which user needs matter most, (c) which assumptions survived
4. **Strategize & Plan** — "The real decisions are about which problems actually matter"
5. **Execute & Launch** — "Launch is when you find out if the design actually holds"

## Accessibility Fundamentals
- **Color contrast**: minimum 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- **Focus states**: never remove them — always provide visible focus indicators
- **Touch targets**: minimum 44x44px for interactive elements on mobile
- **Semantic HTML**: use proper heading hierarchy (h1-h6), landmark elements, aria attributes
- **Don't rely on color alone**: pair color with icons, underlines, or text labels
- **Reduced motion**: respect prefers-reduced-motion media query

## UX Design Process (5 Stages)
1. **Define problem** — Identify core problem, understand user needs
2. **Conduct research** — Interviews, surveys, usability tests, user personas
3. **Design prototypes** — Wireframes → high-fidelity → interactive prototypes
4. **Test & gather feedback** — Usability testing, A/B testing, contextual inquiry
5. **Iterate & refine** — Analytics, surveys, user interviews post-launch

## UX vs UI Design
| UX Design | UI Design |
|---|---|
| User's overall experience | Visual elements — buttons, colors, layouts |
| Research and testing | Aesthetically pleasing interfaces |
| Design intuitive products | Design what users interact with |

## Visual Hierarchy Principles
1. **Size** — larger elements are perceived as more important
2. **Color** — high contrast or accent colors draw attention first
3. **Spacing** — elements with more whitespace feel more significant
4. **Position** — top and left are perceived as primary (in LTR cultures)
5. **Typography** — bold and distinctive fonts signal importance
6. **Depth** — shadows and elevation create perceived importance (cards floating above surface)

```css
/* Applying all 6 hierarchy principles */
.pricing-card.featured {
  /* 1. Size */ transform: scale(1.05);
  /* 2. Color */ border-color: var(--color-action-primary);
  /* 3. Spacing */ margin: 2rem 0;
  /* 4. Position */ order: -1; /* appears first in grid */
  /* 5. Typography */ font-weight: 700;
  /* 6. Depth */ box-shadow: 0 12px 40px rgba(79,70,229,0.15);
}
```

## 6 Laws of UX for Premium Design

### 1. Hick's Law
The time to make a decision increases with the number of choices.
- Limit navigation to 5-7 items
- Limit pricing tiers to 3-4
- Limit form fields to what's essential

### 2. Fitts's Law
The time to acquire a target is a function of distance and size.
- Make primary CTAs large and easy to click
- Place important actions in easy-to-reach areas
- Minimum touch target: 44x44px

### 3. Law of Proximity
Elements close together are perceived as related.
- Group related form fields
- Place labels close to their inputs
- Use spacing to create visual groups

### 4. Law of Similarity
Similar elements are perceived as related.
- Consistent button styles = same action type
- Same color badges = same category
- Same card layout = same content type

### 5. Jakob's Law
Users spend most of their time on other sites, so they expect yours to work the same way.
- Use familiar patterns (logo top-left, nav top, cart top-right)
- Don't reinvent standard interactions
- Follow platform conventions

### 6. Miller's Law
The average person can hold 7 (±2) items in working memory.
- Break long forms into steps
- Show 5-7 nav items max
- Chunk information into digestible groups

## Gestalt Principles Applied

```css
/* Proximity - related items grouped */
.pricing-features li + li {
  margin-top: 0.75rem; /* tight grouping */
}
.pricing-features {
  margin-bottom: 1.5rem; /* separation from next section */
}

/* Similarity - consistent visual language */
.card,
.form-group,
.alert {
  border-radius: 8px; /* same radius = same system */
}

/* Closure - implied shapes */
.progress-bar {
  height: 8px;
  background: var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: var(--color-action-primary);
  border-radius: 4px;
  transition: width 300ms ease;
}
```

## When to break the rules
Premium design sometimes deliberately breaks conventions for impact:
- **Neo-brutalism**: raw, unpolished visuals that stand out
- **Minimalist**: extreme whitespace that "wastes" space for elegance
- **Maximalist**: dense compositions that demand attention
Break rules **intentionally and with purpose**, never by accident.

## Cross-References
- See [layout-spacing.md](./layout-spacing.md) for grid systems and proximity implementation
- See [color-theory.md](./color-theory.md) for contrast and color hierarchy
- See [typography.md](./typography.md) for typographic hierarchy
- See [accessibility.md](./accessibility.md) for WCAG compliance specifics
- See [interaction-design.md](./interaction-design.md) for UX laws in interactive context
- See [ui-components.md](./ui-components.md) for consistent component patterns
