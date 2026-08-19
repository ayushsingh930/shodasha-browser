# Accessibility for Premium Web Design

> Designing premium experiences means designing for everyone. Accessibility is not a constraint — it's a hallmark of quality.

## Quick Reference

| Rule | Specification |
|------|--------------|
| Normal text contrast (AA) | **4.5:1 minimum** |
| Normal text contrast (AAA) | **7:1 minimum** |
| Large text contrast | **3:1 (AA), 4.5:1 (AAA)** — 18px+ bold or 24px+ regular |
| UI/graphical contrast | **3:1 minimum** |
| Focus indicator | **min 3px outline + 3px offset** |
| Touch targets | **min 44x44px** (48px recommended) |
| Response time | **100-300ms** for interaction feedback |
| Keyboard nav | All interactive elements reachable via Tab |
| Screen reader | Semantic HTML + ARIA where needed |

## WCAG 2.2 Guidelines

### Contrast Requirements
- **Normal text**: minimum 4.5:1 contrast ratio (WCAG AA)
- **Large text** (18px+ bold or 24px+ regular): minimum 3:1
- **UI components and graphical objects**: minimum 3:1
- **AAA compliance**: 7:1 for normal text, 4.5:1 for large text
- Use tools: WebAIM Contrast Checker, Stark plugin for Figma
- Check contrast against **both** light and dark backgrounds

### Colorblindness Considerations
- **Deuteranopia** (green-blind, ~6% males): Avoid red/green alone for status
- **Protanopia** (red-blind, ~2% males): Avoid red/green alone
- **Tritanopia** (blue-yellow, rare): Avoid blue/yellow alone
- Safe approach: Always pair color with **icons, patterns, labels, or underlines**
- Test with tools: Sim Daltonism, Chrome DevTools Rendering → Emulate vision deficiencies

```css
/* Use multiple indicators, not just color */
.error {
  border-color: #DC2626;
  padding-left: 2rem;
  background: url('error-icon.svg') no-repeat left center;
  color: #991B1B; /* Must pass 4.5:1 on its background */
}
```

### Focus States
- Never remove focus outlines (`outline: none`) without providing a custom alternative
- Use `:focus-visible` for keyboard-only focus indicators
- Minimum focus indicator: 3px outline + 3px offset
- High contrast between focus ring and background

```css
:focus-visible {
  outline: 3px solid var(--color-action-primary);
  outline-offset: 3px;
  border-radius: 2px; /* Matches element's border-radius */
}

/* For rounded elements like buttons */
button:focus-visible {
  outline: 3px solid var(--color-action-primary);
  outline-offset: 3px;
  border-radius: 6px;
}
```

### Touch Targets
- Minimum: 44x44px for all interactive elements on mobile (48px recommended for premium)
- Adequate spacing between touch targets: minimum 8px gap
- Buttons, links, form inputs all need sufficient size

```css
/* Ensure touch targets meet minimum size */
.btn,
.nav-link,
input,
select,
textarea {
  min-height: 44px;
  min-width: 44px;
}

/* Spacing between touch targets */
.touch-group {
  display: flex;
  gap: 8px;
}
```

### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3, no skipping levels)
- Landmark elements: `<nav>`, `<main>`, `<footer>`, `<aside>`
- ARIA attributes where native HTML semantics are insufficient
- Form inputs with associated `<label>` elements

```html
<!-- Proper landmark structure -->
<header role="banner">
  <nav aria-label="Main navigation">
    <a href="/" aria-current="page">Home</a>
  </nav>
</header>

<main role="main">
  <h1>Page Title</h1>
  <section aria-labelledby="section1-heading">
    <h2 id="section1-heading">Section Title</h2>
  </section>
</main>

<footer role="contentinfo">
  <p>&copy; 2026 Company Name</p>
</footer>
```

### Skip-to-Content Pattern

```html
<!-- First focusable element on the page -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
```

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 8px;
  padding: 8px 16px;
  background: var(--color-action-primary);
  color: #fff;
  z-index: 9999;
  border-radius: 0 0 8px 8px;
}

.skip-link:focus {
  top: 0;
}
```

### ARIA Patterns for Premium Components

**Modal Dialog**
```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
  <h2 id="modal-title">Confirm Action</h2>
  <p id="modal-desc">Are you sure you want to delete this item?</p>
  <button aria-label="Close modal">&times;</button>
  <button>Cancel</button>
  <button>Delete</button>
</div>
```

**Accordion / Disclosure**
```html
<div class="accordion">
  <h3>
    <button aria-expanded="false" aria-controls="panel-1">
      Accordion Title
    </button>
  </h3>
  <div id="panel-1" role="region" aria-labelledby="accordion-header-1" hidden>
    Panel content
  </div>
</div>
```

**Tabs**
```html
<div role="tablist" aria-label="Content sections">
  <button role="tab" aria-selected="true" aria-controls="tab-1" id="tab-btn-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="tab-2" id="tab-btn-2">Tab 2</button>
</div>
<div role="tabpanel" id="tab-1" aria-labelledby="tab-btn-1">
  Tab 1 content
</div>
<div role="tabpanel" id="tab-2" aria-labelledby="tab-btn-2" hidden>
  Tab 2 content
</div>
```

### Focus Trapping (Modals, Drawers)

```javascript
const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function trapFocus(container) {
  const elements = container.querySelectorAll(focusableElements);
  const first = elements[0];
  const last = elements[elements.length - 1];

  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
```

## Premium Accessibility Checklist
- [ ] Color contrast 4.5:1 minimum for all text (7:1 for AAA)
- [ ] Focus indicators visible on all interactive elements (3px + 3px offset)
- [ ] Touch targets minimum 44x44px
- [ ] Semantic heading structure (no skipped levels)
- [ ] Alt text on all images (decorative images get `alt=""`)
- [ ] Form labels properly associated with inputs
- [ ] Keyboard navigation works for all features
- [ ] `prefers-reduced-motion` respected
- [ ] Don't rely on color alone — use icons, underlines, labels
- [ ] Screen reader testing completed
- [ ] Skip-to-content link present
- [ ] Focus is trapped in modals/drawers
- [ ] Error messages are announced by screen readers (`aria-live="polite"`)
- [ ] Touch targets have adequate spacing (8px minimum gap)
- [ ] Zoom tested to 200% without content cutoff

## Reduced Motion

### CSS Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Providing Motion-Free Alternatives

```css
/* Parallax - provide static fallback */
@media (prefers-reduced-motion: reduce) {
  .parallax-section {
    background-attachment: scroll;
    transform: none !important;
  }
}

/* Scroll-triggered reveals - show by default */
@media (prefers-reduced-motion: reduce) {
  .fade-in,
  .slide-up {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

## Color Independence
- Never convey information through color alone
- Error states: red border + error icon + text message
- Links: underlined or bold, not just colored differently
- Charts: patterns + labels, not just color coding

```css
/* Accessible error state */
.form-error {
  border-color: #DC2626;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23DC2626"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>') no-repeat 12px center;
  background-size: 20px;
  padding-left: 40px;
}

/* Off-screen label for icon-only links */
.visually-hidden:not(:focus):not(:active) {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Live Regions for Dynamic Content

```html
<!-- Announce success/error messages -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  Form submitted successfully.
</div>

<!-- Loading states (announce when complete) -->
<div role="status" aria-live="polite">
  <span class="spinner"></span>
  <span class="sr-only">Loading search results...</span>
</div>
```

## Cross-References
- See [color-theory.md](./color-theory.md) for accessible palette creation and contrast ratios
- See [typography.md](./typography.md) for accessible font sizing and line-height
- See [ui-components.md](./ui-components.md) for accessible button and form patterns
- See [interaction-design.md](./interaction-design.md) for reduced motion and animation patterns
- See [responsive-design.md](./responsive-design.md) for responsive touch targets

## Resources
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Figma Stark Plugin: accessibility checking inside Figma
- Source: https://www.figma.com/resource-library/ui-design-principles/
