# UI Context — Design Language

## Theme

[Describe the design theme — dark/light, aesthetic direction, visual style]

## Colors

[Define color palette — use CSS custom properties for all values]

| Role | CSS Variable | Value |
|------|-------------|-------|
| Page background | `--bg-base` | [value] |
| Surface | `--bg-surface` | [value] |
| Primary text | `--text-primary` | [value] |
| Muted text | `--text-muted` | [value] |
| Accent primary | `--accent-primary` | [value] |
| Border default | `--border-default` | [value] |
| Error | `--state-error` | [value] |
| Success | `--state-success` | [value] |

## Typography

| Role | Font | Variable | Weight scale |
|------|------|----------|-------------|
| Headings | [Font] | [CSS variable] | [weight range] |
| Body | [Font] | [CSS variable] | [weight range] |
| Code/mono | [Font] | [CSS variable] | [weight range] |

- Body line length: 65–75ch max
- Display headings: clamp() sizing
- Use `text-wrap: balance` on h1–h3

## Border Radius

| Context | Value |
|---------|-------|
| Inline / small UI | [value] |
| Cards / panels | [value] |
| Modals / overlays | [value] |
| Buttons | [value] |

## Component Library

**Reference DESIGN.md for the curated list.** Primary sources:
- **Astryx (Meta)** — production-grade components, tokens, layouts: https://astryx.atmeta.com/docs/getting-started
- **Animata / Cult UI / Skipper UI** — animated premium components
- **HeroUI (shadcn)** — modern utility components (use sparingly)

## Layout Patterns

[Describe key layout patterns — page shell, navbar, hero, grids, footer]

## Icons

Use **lucide-react** as the primary icon library. Sizes: sm (16px), md (20px), lg (24px).

## Motion

- Entry animations: Motion (Framer Motion) useInView with staggered children
- Scroll progress: GSAP ScrollTrigger
- Micro-interactions: CSS transitions on hover/active
- Custom easing: [cubic-bezier values]
- All motion respects `@media (prefers-reduced-motion: reduce)`

## Design Token References

- Astryx Theme System: https://astryx.atmeta.com/docs/theme
- Astryx Color: https://astryx.atmeta.com/docs/color
- Astryx Typography: https://astryx.atmeta.com/docs/typography
- Astryx Spacing: https://astryx.atmeta.com/docs/spacing
- Astryx Motion: https://astryx.atmeta.com/docs/motion