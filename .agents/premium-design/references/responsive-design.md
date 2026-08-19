# Responsive Web Design for Premium Web Design

## Quick Reference

| Breakpoint | Label | Target |
|------------|-------|--------|
| 0-639px | **Mobile** | Base styles |
| 640-1023px | **Tablet** | `@media (min-width: 640px)` |
| 1024-1279px | **Desktop** | `@media (min-width: 1024px)` |
| 1280px+ | **Wide** | `@media (min-width: 1280px)` |

### Key Rules
- **Mobile first**: Base styles = mobile, media queries add complexity
- **Touch targets**: Minimum 44x44px (48px recommended)
- **Body font**: Never below 16px (prevents iOS zoom on focus)
- **Images**: Always `max-width: 100%; height: auto`
- **No horizontal scroll**: Test at every breakpoint
- **Content reflows**: Don't just shrink — restructure layout

## Core Components

### 1. Fluid Grid Layouts
Use relative units (%, fr, vw) instead of fixed pixel widths:
```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}
```

### 2. Flexible Images & Media
```css
img, video {
  max-width: 100%;
  height: auto;
  display: block;
}
```

### 3. CSS Media Queries
```css
/* Mobile first */
@media (min-width: 640px) { /* tablet */ }
@media (min-width: 1024px) { /* desktop */ }
@media (min-width: 1280px) { /* wide */ }
```

### 4. Responsive Text (Fluid Typography)
```css
h1 {
  font-size: clamp(1rem, 10vw, 3rem);
}
```

### 5. Responsive Navigation
```css
.nav-links { display: flex; gap: 24px; }
@media (max-width: 768px) {
  .nav-links { display: none; }
  .menu-toggle { display: block; }
}
```

## CSS Container Queries

Container queries let components respond to their container's width, not the viewport:

```css
/* Define a container */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Query the container */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 1rem;
  }
}

@container card (min-width: 600px) {
  .card-title {
    font-size: 1.5rem;
  }
}

/* Shorthand */
.card-container {
  container: card / inline-size;
}
```

### Container Query Units
```css
.card {
  padding: 1cqi;  /* 1% of container's inline size */
  font-size: clamp(1rem, 3cqi, 1.5rem);
  width: min(100%, 50cqw);
}
```

## Responsive CSS Grid Patterns

### Auto-fill grid (most common)
```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}
```

### Sidebar layout
```css
.page-with-sidebar {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .page-with-sidebar {
    grid-template-columns: 1fr;
  }
}
```

### Dashboard layout
```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.dashboard .full-width { grid-column: 1 / -1; }
.dashboard .half-width { grid-column: span 2; }
.dashboard .third-width { grid-column: span 1; }

@media (max-width: 1024px) {
  .dashboard { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .dashboard { grid-template-columns: 1fr; }
}
```

## Responsive Images

### Using srcset and sizes
```html
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w,
    image-1600.jpg 1600w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  alt="Description"
  loading="lazy"
  decoding="async"
/>
```

### Picture element for art direction
```html
<picture>
  <source media="(max-width: 640px)" srcset="hero-mobile.jpg" />
  <source media="(max-width: 1024px)" srcset="hero-tablet.jpg" />
  <img src="hero-desktop.jpg" alt="Hero" loading="eager" />
</picture>
```

### CSS background-image responsive
```css
.hero {
  background-image: url('hero-mobile.jpg');
  background-size: cover;
  background-position: center;
}

@media (min-width: 640px) {
  .hero { background-image: url('hero-tablet.jpg'); }
}

@media (min-width: 1024px) {
  .hero { background-image: url('hero-desktop.jpg'); }
}

/* Using image-set for density */
.hero {
  background-image: image-set(
    url('hero.jpg') 1x,
    url('hero@2x.jpg') 2x
  );
}
```

## Responsive Tables

```css
/* Convert table to cards on mobile */
@media (max-width: 640px) {
  table, thead, tbody, th, td, tr {
    display: block;
  }

  thead { display: none; } /* Hide headers */

  td {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
  }

  td::before {
    content: attr(data-label);
    font-weight: 600;
  }

  tr + tr {
    margin-top: 1rem;
    border-top: 2px solid var(--color-border-default);
    padding-top: 0.5rem;
  }
}
```

## Responsive Embeds (Video, Maps)

```css
.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
}

.video-wrapper iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

## Fluid Typography with clamp()

```css
/* Heading: scales smoothly */
h1 {
  font-size: clamp(2rem, 1rem + 4vw, 4.5rem);
  line-height: 1.1;
}

h2 {
  font-size: clamp(1.5rem, 1rem + 2vw, 2.5rem);
}

body {
  font-size: clamp(1rem, 0.9rem + 0.25vw, 1.125rem);
}
```

## Responsive Navigation Patterns

### Hamburger menu CSS
```css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
    position: fixed;
    inset: 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: var(--color-bg-primary);
    gap: 1.5rem;
  }

  .nav-links.is-open {
    display: flex;
  }

  .menu-toggle {
    display: block;
  }
}
```

### Responsive font size for nav
```css
.nav a {
  font-size: clamp(0.875rem, 0.8rem + 0.25vw, 1rem);
}
```

## Responsive Form Layout

```css
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

## Responsive Spacing Scale

```css
:root {
  --section-padding: 2rem; /* mobile base */
}

@media (min-width: 640px) {
  :root { --section-padding: 3rem; }
}

@media (min-width: 1024px) {
  :root { --section-padding: 5rem; }
}

section {
  padding-block: var(--section-padding);
}
```

## Framework Recommendations

| Framework | Best For | Key Strength |
|---|---|---|
| **Tailwind CSS** | Custom complex layouts | Utility classes with responsive variants |
| **Bootstrap** | Rapid prototyping | Pre-built components, grid system |
| **Pure CSS** | Small projects, precise styling | Lightweight, full control |
| **Foundation** | Complex sites with Sass | Semantic HTML, WCAG compliance |

## Responsive Design Checklist
- [ ] Layout uses relative units (%, fr, rem, vw)
- [ ] Media queries at 640px, 1024px, 1280px breakpoints
- [ ] Images use max-width: 100% with srcset/sizes
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Font sizes use clamp() or scale with media queries
- [ ] Navigation adapts (hamburger on mobile)
- [ ] No horizontal scroll on any screen size
- [ ] Content reflows (not just shrinks) on mobile
- [ ] Container queries used for component-level responsiveness
- [ ] Tables convert to card layout on mobile
- [ ] Embeds maintain aspect ratio
- [ ] Forms stack vertically on mobile
- [ ] Tested at 200% zoom without content cutoff

## Mobile-First Spacing
```css
section { padding: 2rem 1rem; }
@media (min-width: 640px) { section { padding: 3rem 1.5rem; } }
@media (min-width: 1024px) { section { padding: 5rem 2rem; } }
```

## Testing Responsive Designs
- Use browser DevTools device mode
- Test on real devices when possible
- Check all breakpoints for layout breaks
- Verify touch interactions on mobile
- Test with screen readers

## Cross-References
- See [layout-spacing.md](./layout-spacing.md) for grid systems and spacing scale
- See [typography.md](./typography.md) for fluid typography with clamp()
- See [ui-components.md](./ui-components.md) for responsive component patterns
- See [landing-pages.md](./landing-pages.md) for page-level responsive structure
- See [accessibility.md](./accessibility.md) for touch target and zoom requirements
- See [design-tokens.md](./design-tokens.md) for responsive spacing tokens

Source: https://www.figma.com/resource-library/responsive-website-design/
