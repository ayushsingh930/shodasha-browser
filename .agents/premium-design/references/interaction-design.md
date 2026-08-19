# Interaction Design for Premium Web Design

## Quick Reference

| Principle | Specification |
|-----------|--------------|
| Response feedback | **100-300ms** for all interactions |
| Button micro-interaction | **150ms** ease, subtle color + 1px lift |
| Page transitions | **200-300ms** ease-out (fade + slide) |
| Scroll reveal | opacity 0→1, **translateY(20px)→0**, 400-600ms |
| Spring animation | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Error shake | 50ms translateX oscillation, 3 cycles |
| Touch response | **100ms** visual feedback on tap |
| Loading skeleton | 1.5s pulse cycle, opacity 0.4→0.8 |
| Form validation | Show errors on blur, not on keystroke |

## Definition
Interaction design (IxD) is the practice of designing interactive products, services, and systems. It bridges the gap between people and technology by creating interfaces that are intuitive and engaging.

## The Five Dimensions of Interaction Design

| Dimension | Description | Example |
|---|---|---|
| **1D: Words** | Text users encounter — instructions, labels, error messages, button text | Clear "Submit" vs vague "Click here" |
| **2D: Visual representations** | Graphic elements — icons, images, typography, layout | Trash icon for delete, magnifying glass for search |
| **3D: Physical objects/space** | Devices and environments — phone, tablet, desktop, kiosk | Tap vs click vs swipe interaction |
| **4D: Time** | Dynamic aspects — animations, transitions, progress indicators, sound | Button press animation, loading spinner |
| **5D: Behavior** | How users interact and how the system responds | Click → action, error → recovery path |

## Core Interaction Principles

### User-Centered Design
- Create user personas to inform design decisions
- Conduct user research (interviews, surveys, usability testing)
- Design for accessibility — works for visual, auditory, motor, and cognitive abilities
- Prioritize efficiency — users achieve goals quickly with minimal effort

### Clarity and Feedback
- Users should instantly understand what elements do (affordances)
- Grayed-out options show constraints
- Feedback (visual, auditory, tactile) confirms actions succeeded
- Every interaction gets a response within 100-300ms

### Consistency and Predictability
- Same patterns, behaviors, and styles throughout the product
- Actions lead to expected outcomes
- Use design systems to enforce consistency
- Stick to established conventions (nav at top, logo top-left)

### Cognition (Reduce Cognitive Load)
- Present content clearly with familiar language
- Use intuitive mental models users already understand

## Key Psychology Laws for Interaction Design

### Fitts's Law
Time to hit a target = size + distance. Make frequently used actions bigger and closer.

```css
/* Apply Fitts's Law to CTAs */
.primary-cta {
  min-height: 48px; /* larger target */
  padding: 1rem 2rem;
  font-size: 1.125rem;
  /* Position in easy-to-reach area */
  position: sticky;
  bottom: 2rem;
}

/* Floating action button */
.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  box-shadow: var(--shadow-lg);
}
```

### Hick's Law
Decision time increases with choices. Streamline options, break complex choices into steps.

### Gestalt Principles
Humans naturally group related visuals. Use proximity, similarity, closure, and continuity to create clear layouts.

## Interaction Design vs Related Disciplines

| Discipline | Focus |
|---|---|
| **UI Design** | Visual arrangement — icons, buttons, spacing, layout, aesthetics |
| **UX Design** | Entire user journey — research, strategy, overall satisfaction |
| **Interaction Design** | Behavior of elements — how they respond to input, task flow |

## Micro-interactions
Small, purposeful moments in the interface:
- **Trigger**: User action or system state change
- **Rules**: What happens during the interaction
- **Feedback**: What the user sees/hears/feels
- **Loops/Modes**: What happens after (metaphor, repeat behavior)

### Premium Micro-interaction Patterns

**Button hover (150ms ease)**
```css
.btn {
  transition: transform 150ms var(--ease-spring),
              background 150ms ease,
              box-shadow 150ms ease;
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.btn:active {
  transform: translateY(0) scale(0.98);
}
```

**Form submit with success state**
```css
.btn-submit.is-loading {
  pointer-events: none;
  opacity: 0.75;
}
.btn-submit.is-loading::after {
  content: '';
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 600ms linear infinite;
  margin-left: 0.5rem;
}
.btn-submit.is-success {
  background: #059669;
}
.btn-submit.is-success::after {
  content: '✓';
  animation: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Error shake animation**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.input-error {
  animation: shake 250ms ease;
  border-color: #DC2626;
}
```

**Scroll reveal animation**
```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 600ms ease-out,
              transform 600ms ease-out;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```javascript
// Intersection Observer for scroll reveals
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // Animate once
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

**Skeleton loading**
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

.skeleton-text {
  height: 1rem;
  margin-bottom: 0.5rem;
  width: 80%;
}
.skeleton-title {
  height: 1.5rem;
  width: 60%;
  margin-bottom: 1rem;
}
```

## Page Transitions

```css
/* Page enter/exit */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}
.page-exit-active {
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 200ms ease-in, transform 200ms ease-in;
}
```

## Gesture Patterns (Mobile)

| Gesture | Action | Visual feedback |
|---------|--------|-----------------|
| Tap | Select / activate | 100ms scale(0.96) |
| Long press | Context menu | 300ms haptic + highlight |
| Swipe | Dismiss / navigate | Follow finger with resistance |
| Pinch | Zoom | Smooth scale transform |
| Pull to refresh | Reload content | 60px trigger threshold |

```css
/* Touch feedback on mobile */
.touchable {
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease;
}
.touchable:active {
  transform: scale(0.96);
}
```

## State Diagrams for UX
Map button state combinations across screens to catch edge cases early:
1. Identify all interactive elements on a screen
2. List every possible state for each element
3. Map combined states (e.g., submit button loading + input field error)
4. Ensure every state combination has a clear path forward

### Button state machine example

```
default → hover → active → success (1.5s) → default
default → hover → active → loading → disabled → default
default → focus → hover → default
default → disabled → default (when conditions met)
```

## Animation Timing Cheat Sheet

| Element | Duration | Easing |
|---------|----------|--------|
| Button hover | 150ms | ease-out |
| Button press | 100ms | ease-in |
| Page transition | 200-300ms | ease-out |
| Modal enter | 200ms | ease-out |
| Modal exit | 150ms | ease-in |
| Scroll reveal | 400-600ms | ease-out |
| Skeleton shimmer | 1.5s | linear |
| Mobile ripple | 600ms | ease-out |
| Notification slide | 300ms | ease-out |
| Progress bar | 300ms | ease |

## Cross-References
- See [accessibility.md](./accessibility.md) for `prefers-reduced-motion` and focus states
- See [ui-components.md](./ui-components.md) for component-specific interaction patterns
- See [design-tokens.md](./design-tokens.md) for animation duration/easing tokens
- See [layout-spacing.md](./layout-spacing.md) for responsive touch target spacing
- See [landing-pages.md](./landing-pages.md) for scroll-based interactions and reveal patterns

## Resources
- *The Design of Everyday Things* by Don Norman
- *Don't Make Me Think* by Steve Krug
- *About Face: The Essentials of Interaction Design* by Alan Cooper
- Source: https://www.figma.com/resource-library/interaction-design/
