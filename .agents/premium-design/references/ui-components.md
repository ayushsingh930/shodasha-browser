> Source: [Button States](https://www.figma.com/resource-library/button-states/) · [UI Design Principles](https://www.figma.com/resource-library/ui-design-principles/)

# UI Components for Premium Web Design

## Quick Reference

| Component | Key Spec |
|-----------|----------|
| Button min touch target | **44x44px** (48px recommended) |
| Button transition | **100-200ms** |
| Input height | **44px min** (48px recommended) |
| Input padding | **12px 16px** |
| Input border-radius | **6-8px** |
| Input font-size | **16px** (prevents iOS zoom) |
| Card border-radius | **12-16px** |
| Card shadow subtle | `0 1px 3px rgba(0,0,0,0.06)` |
| Card shadow hover | `0 12px 40px rgba(0,0,0,0.12)` |
| Header backdrop-filter | **blur(12px)** |
| Max nav items | **5-7** |
| Pricing tiers | **3-4** |

## Button Design

### 5 Core States

| State | Trigger | Visual Treatment |
|---|---|---|
| Default | Page load, no interaction | Base color, full opacity |
| Hover | Cursor moves over | Subtle color shift or shadow lift |
| Active / Pressed | During click | Darker fill, transform: scale(0.98) |
| Focus | Keyboard nav | Visible focus ring (3px outline + offset) |
| Disabled | Action unavailable | Muted fill, reduced contrast, cursor: not-allowed |

### 4 Functional States

| State | Visual Treatment |
|---|---|
| Loading | Spinner, reduced opacity, disabled to prevent double-submit |
| Success | Green fill, checkmark icon, brief animation (1-2s) |
| Error | Red fill/border + inline error message |
| Selected / Toggle | Filled or inverted style, persists |

### Complete CSS Pattern (All States)
```css
.btn {
  background-color: #4F46E5;
  color: #ffffff;
  border: 2px solid transparent;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 150ms ease, outline 150ms ease;
  min-height: 44px; /* touch target */
}
.btn:hover { background-color: #4338CA; }
.btn:active { background-color: #3730A3; transform: scale(0.98); }
.btn:focus-visible { outline: 3px solid #6366F1; outline-offset: 3px; }
.btn:disabled,
.btn[aria-disabled="true"] { background-color: #E5E7EB; color: #9CA3AF; cursor: not-allowed; pointer-events: none; }
.btn.is-loading { opacity: 0.75; cursor: wait; pointer-events: none; }
.btn[aria-pressed="true"] { background-color: #3730A3; outline: 2px solid #6366F1; }
```

### Button hierarchy
- **Primary**: Solid fill, high contrast, most prominent
- **Secondary**: Outline or ghost, same shape as primary
- **Tertiary**: Text-only link style, minimal
- Minimum touch target: **44x44px** (mobile)
- Transition timing: **100ms-200ms**

```css
.btn-primary {
  background: var(--color-action-primary);
  color: #fff;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(79,70,229,0.3);
}

.btn-secondary {
  background: transparent;
  color: var(--color-action-primary);
  border: 2px solid var(--color-action-primary);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-primary);
  border: 2px solid transparent;
}

.btn-link {
  background: none;
  color: var(--color-action-primary);
  padding: 0;
  border: none;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Size variants */
.btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
.btn-lg { padding: 1rem 2rem; font-size: 1.125rem; min-height: 52px; }
```

## Form Design

### Input states
- Default: subtle border, clean label above
- Focus: accent-colored border, label shifts up (floating label pattern)
- Error: red border, error message below, aria-invalid="true"
- Success: green border, optional checkmark
- Disabled: reduced opacity, no pointer events
- Filled: persistent label position

### Input sizing
- Height: minimum 44px (48px recommended)
- Padding: 12px 16px
- Border-radius: 8px (or 6px for tighter UI)
- Font-size: 16px (prevents iOS zoom on focus)

### Complete Input CSS
```css
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  outline: none;
}

.form-input::placeholder {
  color: var(--color-text-disabled);
}

.form-input:focus {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
}

.form-input[aria-invalid="true"] {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(220,38,38,0.12);
}

.form-input:disabled {
  background: var(--color-bg-secondary);
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  font-size: 0.8125rem;
  color: var(--color-error);
  margin-top: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
```

### Floating Label Pattern
```html
<div class="floating-input-group">
  <input type="email" id="email" class="floating-input" placeholder=" " />
  <label for="email" class="floating-label">Email address</label>
</div>
```

```css
.floating-input-group {
  position: relative;
  margin-bottom: 1.5rem;
}

.floating-input {
  width: 100%;
  height: 56px;
  padding: 1.5rem 1rem 0.5rem;
  font-size: 1rem;
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  outline: none;
  background: var(--color-bg-primary);
}

.floating-label {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  transition: all 150ms ease;
  pointer-events: none;
  font-size: 1rem;
}

.floating-input:focus + .floating-label,
.floating-input:not(:placeholder-shown) + .floating-label {
  top: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-action-primary);
}

.floating-input:focus {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
}
```

### Form layout best practices
- Single column layout (higher completion rate than multi-column)
- Labels above fields (best readability)
- Group related fields with fieldset/legend or visual section headers
- Error messages: inline, specific, below the relevant field
- Submit button: full-width on mobile, aligned left on desktop

```css
/* Form layout */
.form {
  max-width: 480px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.form-actions .btn-primary {
  flex: 1;
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column;
  }
  .form-actions .btn-primary {
    width: 100%;
  }
}
```

## Card Design

### Premium card patterns
```css
.card {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  /* Subtle — elegant for minimalist */
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  /* Or more pronounced for expressive */
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
}
```

### Card types
- **Default**: white bg, subtle shadow, rounded corners
- **Bordered**: no shadow, thin border (1px solid #eee)
- **Elevated**: more shadow, hover lift
- **Glass**: backdrop-filter blur, translucent background
- **Dark**: dark background, light text

```css
.card-bordered {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-default);
  border-radius: 12px;
  padding: 1.5rem;
}

.card-glass {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  padding: 1.5rem;
}

.card-dark {
  background: #1A1A1A;
  color: #F5F0EB;
  border-radius: 16px;
  padding: 1.5rem;
}
```

## Navigation Patterns

### Premium nav structure
- Logo left, nav links center or right, CTA rightmost
- Max 5-7 nav items
- Sticky header on scroll with subtle backdrop-filter blur
- Active/current page indicator (underline or dot)
- Mobile: hamburger with smooth slide-in drawer

### Header pattern
```css
header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
```

### Full Navigation HTML+CSS
```html
<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="logo" aria-label="Home">
      <svg><!-- logo --></svg>
    </a>
    <nav aria-label="Main">
      <ul class="nav-links">
        <li><a href="#features" class="nav-link">Features</a></li>
        <li><a href="#pricing" class="nav-link">Pricing</a></li>
        <li><a href="#about" class="nav-link">About</a></li>
        <li><a href="#contact" class="nav-link">Contact</a></li>
      </ul>
    </nav>
    <a href="#cta" class="btn btn-primary">Get Started</a>
    <button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false">
      <span class="hamburger"></span>
    </button>
  </div>
</header>
```

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.nav-links {
  display: flex;
  gap: 0.25rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 150ms ease, background 150ms ease;
}

.nav-link:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
}

.nav-link[aria-current="page"] {
  color: var(--color-action-primary);
  font-weight: 600;
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
    gap: 0.5rem;
  }

  .nav-links.is-open { display: flex; }

  .nav-link {
    font-size: 1.25rem;
    padding: 1rem 2rem;
  }

  .menu-toggle { display: block; }
}
```

### Active Indicator
```css
/* Underline indicator */
.nav-link {
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 60%;
  height: 2px;
  background: var(--color-action-primary);
  transition: transform 200ms ease;
}

.nav-link:hover::after,
.nav-link[aria-current="page"]::after {
  transform: translateX(-50%) scaleX(1);
}
```

## Hero Section Patterns

### Minimalist hero
```
[Headline (2.5-4.5rem)]
[Subheadline (1.125-1.25rem)]
[Primary CTA] [Secondary CTA]
--- optional: subtle background gradient or pattern ---
```

### Split hero
```
[col-1: Headline + Subheadline + CTA] [col-2: Image/Illustration/Demo]
Grid: 1fr 1fr or 3fr 2fr
```

### Full-screen hero
```css
.hero {
  min-height: 90vh; /* or 100vh */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
```

## Pricing Card Design

### Layout
- 3-4 tiers horizontally on desktop
- Stack vertically on mobile
- Highlighted "Most Popular" plan (different border color or slight scale-up)
- Monthly / Annual toggle with savings badge

### Premium pricing card pattern
```css
.pricing-card {
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e8e8ec;
  background: #fff;
  transition: all 200ms ease;
}
.pricing-card.featured {
  border-color: #4F46E5;
  box-shadow: 0 8px 32px rgba(79,70,229,0.12);
  transform: scale(1.02);
}
```

### Content structure (top to bottom)
1. Plan name
2. Price (large, prominent)
3. Description (1 sentence)
4. Feature list (checkmarks)
5. CTA button

## Dialog / Modal Pattern

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 1rem;
  opacity: 0;
  transition: opacity 200ms ease;
}

.modal-overlay.is-open {
  opacity: 1;
}

.modal {
  background: var(--color-bg-primary);
  border-radius: 16px;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  transform: translateY(20px) scale(0.98);
  transition: transform 200ms ease;
}

.modal-overlay.is-open .modal {
  transform: translateY(0) scale(1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-bg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## Toast / Notification Pattern

```css
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 400;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast {
  padding: 1rem 1.25rem;
  border-radius: 10px;
  background: var(--color-bg-primary);
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: toast-in 300ms ease-out;
  max-width: 400px;
}

.toast-success { border-left: 4px solid #059669; }
.toast-error { border-left: 4px solid #DC2626; }
.toast-info { border-left: 4px solid #3B82F6; }

@keyframes toast-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## Skeleton Loading Pattern

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-border-default) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-card {
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid var(--color-border-default);
}

.skeleton-img {
  width: 100%;
  height: 200px;
  margin-bottom: 1rem;
}

.skeleton-line {
  height: 1rem;
  margin-bottom: 0.5rem;
}

.skeleton-line:last-child {
  width: 60%;
}

.skeleton-title {
  height: 1.5rem;
  width: 70%;
  margin-bottom: 1rem;
}
```

## Cross-References
- See [design-tokens.md](./design-tokens.md) for component token definitions
- See [accessibility.md](./accessibility.md) for focus states, ARIA, and touch targets
- See [interaction-design.md](./interaction-design.md) for micro-interactions and animation
- See [typography.md](./typography.md) for button and label font sizing
- See [layout-spacing.md](./layout-spacing.md) for component spacing and grid placement
- See [landing-pages.md](./landing-pages.md) for page-level component composition
- See [responsive-design.md](./responsive-design.md) for responsive component adaptation
