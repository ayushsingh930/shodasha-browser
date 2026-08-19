> Source: [Design Tokens](https://www.figma.com/resource-library/design-tokens/) · [Design System Examples](https://www.figma.com/resource-library/design-system-examples/)

# Design Tokens for Premium Web Design

## Quick Reference

| Layer | Purpose | Example |
|-------|---------|---------|
| **Primitive tokens** | Raw values, no context | `--blue-500: #3B82F6` |
| **Semantic tokens** | Role-based, context-aware | `--color-action-primary: var(--blue-500)` |
| **Component tokens** | Element-specific mappings | `--button-primary-bg: var(--color-action-primary)` |

### Key Rules
- Semantic tokens always point to primitives — never chain aliases
- Name for role, not appearance — `text-secondary` not `gray-text`
- Define in order: color → spacing → typography → radius → shadows → components
- Use `oklch()` for primitives when possible — better perceptual uniformity

## Token Hierarchy

```
PRIMITIVE TOKENS (raw values)
  -> SEMANTIC TOKENS (role-based names)
    -> COMPONENT TOKENS (element-specific)
```

### Primitive Tokens
Raw values with no context:
```css
--blue-50:  #EFF6FF;
--blue-100: #DBEAFE;
--blue-500: #3B82F6;
--blue-700: #1D4ED8;
--space-4:  4px;
--space-8:  8px;
--space-16: 16px;
--font-size-sm:  0.875rem;
--font-size-base: 1rem;
--font-size-lg:  1.125rem;
```

### Semantic Tokens
Describe role, not appearance:
```css
/* Colors */
--color-text-primary:   var(--gray-900);
--color-text-secondary: var(--gray-500);
--color-text-disabled:  var(--gray-300);
--color-bg-primary:     var(--white);
--color-bg-secondary:   var(--gray-50);
--color-action-primary: var(--blue-500);
--color-action-hover:   var(--blue-700);
--color-border-default: var(--gray-200);
--color-border-focus:   var(--blue-500);
--color-error:          var(--red-600);
--color-success:        var(--green-600);
--color-warning:        var(--amber-500);

/* Spacing */
--spacing-xs:  var(--space-4);
--spacing-sm:  var(--space-8);
--spacing-md:  var(--space-16);
--spacing-lg:  var(--space-24);
--spacing-xl:  var(--space-32);

/* Typography */
--font-family-body:    'Inter', system-ui, sans-serif;
--font-family-heading: 'Playfair Display', Georgia, serif;
--font-size-body:      var(--font-size-base);
--font-size-small:     var(--font-size-sm);
--font-size-h1:        var(--font-size-5xl);
--font-weight-normal:  400;
--font-weight-medium:  500;
--font-weight-bold:    700;
--line-height-body:    1.6;
--line-height-heading: 1.2;
```

### Component Tokens
Map to specific UI elements:
```css
--button-primary-bg:         var(--color-action-primary);
--button-primary-text:       var(--white);
--button-primary-hover-bg:   var(--color-action-hover);
--button-primary-radius:     8px;
--button-primary-padding:    0.75rem 1.5rem;
--card-bg:                   var(--color-bg-primary);
--card-border-radius:        16px;
--card-padding:              var(--spacing-md);
--card-shadow:               0 1px 3px rgba(0,0,0,0.06);
--input-bg:                  var(--color-bg-primary);
--input-border:              var(--color-border-default);
--input-focus-border:        var(--color-border-focus);
--input-radius:              8px;
--input-padding:             0.75rem 1rem;
```

## Naming Convention
```
category / role / variant
```
Examples: `color/text/primary`, `color/action/hover`, `spacing/padding/sm`

## Critical Rules
- **Semantic tokens always point to primitives** — never chain aliases
- **Name for role, not appearance** — `text-secondary` not `gray-text`
- **Cover core UI roles first**: text, background, border, action colors
- **Consistency is non-negotiable** — naming convention applies everywhere
- **Start with color, spacing, typography** — everything else builds on these

## Complete Token Category Reference

### Animation Tokens
```css
--duration-fast:   100ms;
--duration-normal: 200ms;
--duration-slow:   350ms;
--ease-out:        cubic-bezier(0.16, 1, 0.3, 1);
--ease-in:         cubic-bezier(0.4, 0, 1, 1);
--ease-in-out:     cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Opacity Tokens
```css
--opacity-disabled:  0.5;
--opacity-subtle:    0.7;
--opacity-overlay:   0.6;
--opacity-hover:     0.9;
```

### Z-Index Tokens
```css
--z-dropdown:  100;
--z-sticky:    200;
--z-modal:     300;
--z-toast:     400;
--z-tooltip:   500;
```

### Shadow Tokens
```css
--shadow-sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:   0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg:   0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
--shadow-xl:   0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);
--shadow-glow: 0 0 20px rgba(79,70,229,0.3);
```

### Border Radius Tokens
```css
--radius-sm:    4px;
--radius-md:    8px;
--radius-lg:    12px;
--radius-xl:    16px;
--radius-2xl:   24px;
--radius-full:  9999px;
--radius-none:  0;
```

## Variable Modes (Theming)

### Light / Dark Mode
```css
:root, [data-theme="light"] {
  --color-bg-primary: #FFFFFF;
  --color-text-primary: #1A1A2E;
  --color-action-primary: #4F46E5;
}
[data-theme="dark"] {
  --color-bg-primary: #0A0A0A;
  --color-text-primary: #F5F0EB;
  --color-action-primary: #6366F1;
}
```

### JavaScript Theme Toggle
```javascript
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  // Persist preference
  localStorage.setItem('theme', html.getAttribute('data-theme'));
}

// On load: respect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const stored = localStorage.getItem('theme');
document.documentElement.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));
```

### Multi-Brand Theming
Each brand gets its own mode that overrides colors and typography while shared tokens stay consistent.

```css
[data-brand="acme"] {
  --color-action-primary: #2563EB;
  --font-family-heading: 'Inter', sans-serif;
}
[data-brand="globex"] {
  --color-action-primary: #7C3AED;
  --font-family-heading: 'Playfair Display', serif;
}
```

## Token Export Formats

### JSON format (for design tool sync)
```json
{
  "color": {
    "action": {
      "primary": { "value": "{blue.500}", "type": "color" },
      "hover": { "value": "{blue.700}", "type": "color" }
    },
    "text": {
      "primary": { "value": "{gray.900}", "type": "color" },
      "secondary": { "value": "{gray.500}", "type": "color" }
    }
  },
  "spacing": {
    "sm": { "value": "8px", "type": "dimension" },
    "md": { "value": "16px", "type": "dimension" }
  }
}
```

### SCSS format
```scss
$color-action-primary: var(--blue-500);
$spacing-md: 16px;
```

## Token priority order
When building a design system, define tokens in this order:

1. Color primitives
2. Color semantic tokens (text, bg, border, action)
3. Typography (font families, sizes, weights, line heights)
4. Spacing scale
5. Border radius
6. Shadows
7. Animation (duration, easing)
8. Z-index
9. Component tokens (button, card, input, etc.)

## Cross-References
- See [color-theory.md](./color-theory.md) for color palette creation using OKLCH
- See [typography.md](./typography.md) for font sizing and type scale tokens
- See [layout-spacing.md](./layout-spacing.md) for spacing scale implementation
- See [ui-components.md](./ui-components.md) for component token patterns
- See [interaction-design.md](./interaction-design.md) for animation token usage
